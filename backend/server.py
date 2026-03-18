from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from PIL import Image, ImageFilter
import io, base64, json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from skimage.metrics import peak_signal_noise_ratio as psnr
from skimage.metrics import structural_similarity as ssim

app = Flask(__name__)
CORS(app)

# ── Load model and metrics once on startup ─────────────────────────
print("Loading medical denoising model...")
model = tf.keras.models.load_model('denoising_autoencoder.h5', compile=False)
with open('metrics.json') as f:
    METRICS = json.load(f)
print("Model ready.")

# ── Noise functions (medical imaging context) ──────────────────────

def add_gaussian_noise(img_array, factor=0.3):
    """Simulates quantum/electronic noise in X-ray detectors"""
    noise = factor * np.random.normal(size=img_array.shape)
    return np.clip(img_array + noise, 0.0, 1.0)

def add_salt_pepper(img_array, amount=0.05):
    """Simulates dead/hot pixels in X-ray flat-panel detectors"""
    noisy = img_array.copy()
    mask  = np.random.random(img_array.shape) < amount / 2
    noisy[mask] = 1.0
    mask  = np.random.random(img_array.shape) < amount / 2
    noisy[mask] = 0.0
    return noisy

def add_block_corruption(img_array, block_size=6, n_blocks=8):
    """Simulates PACS transmission data loss or DICOM corruption"""
    noisy = img_array.copy()
    h, w  = img_array.shape[0], img_array.shape[1]
    for _ in range(n_blocks):
        y = np.random.randint(0, max(1, h - block_size))
        x = np.random.randint(0, max(1, w - block_size))
        noisy[y:y+block_size, x:x+block_size] = 0.0
    return noisy

NOISE_FUNCTIONS = {
    'gaussian':    lambda x: add_gaussian_noise(x, 0.35),
    'heavy':       lambda x: add_gaussian_noise(x, 0.55),
    'salt_pepper': lambda x: add_salt_pepper(x, 0.06),
    'corruption':  lambda x: add_block_corruption(x),
}

# ── Image helpers ─────────────────────────────────────────────────

def preprocess(image_bytes):
    """
    Load any uploaded image → convert to grayscale → resize to 64×64
    → normalize to [0,1]. Medical images (X-rays, CT) are inherently
    grayscale, so this conversion is natural.
    """
    img          = Image.open(io.BytesIO(image_bytes)).convert('L')   # grayscale
    original_big = img.resize((512, 512), Image.LANCZOS)              # display size
    img_128      = img.resize((128, 128), Image.LANCZOS)              # model input
    arr_128      = np.array(img_128).astype('float32') / 255.0
    arr_128      = arr_128[..., np.newaxis]                           # (128, 128, 1)
    return arr_128, original_big

def arr_to_b64(arr, size=256):
    """Convert numpy array (H×W×1 or H×W) to base64 PNG string."""
    arr_clipped = np.clip(arr * 255, 0, 255).astype(np.uint8)
    if arr_clipped.ndim == 3 and arr_clipped.shape[2] == 1:
        arr_clipped = arr_clipped.squeeze(axis=2)
    img = Image.fromarray(arr_clipped, mode='L')
    img = img.resize((size, size), Image.NEAREST)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def pil_to_b64(pil_img):
    buf = io.BytesIO()
    pil_img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode('utf-8')

def make_diff_heatmap(clean, denoised):
    """
    Pixel-wise difference map visualized as a hot colormap.
    Bright red = large reconstruction error = where the model
    had to do the most work to remove noise from the X-ray.
    """
    # For grayscale: squeeze to 2D before computing diff
    clean_2d    = clean.squeeze()
    denoised_2d = denoised.squeeze()
    diff = np.abs(clean_2d - denoised_2d)
    fig, ax = plt.subplots(figsize=(2.56, 2.56), dpi=100)
    ax.imshow(diff, cmap='hot', vmin=0, vmax=0.3, interpolation='nearest')
    ax.axis('off')
    plt.tight_layout(pad=0)
    buf = io.BytesIO()
    plt.savefig(buf, format='PNG', bbox_inches='tight', pad_inches=0)
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode('utf-8')

# ── ENDPOINT: Dashboard metrics ────────────────────────────────────
@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    return jsonify(METRICS)

# ── ENDPOINT: Denoise uploaded medical image ───────────────────────
@app.route('/api/denoise', methods=['POST'])
def denoise():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    noise_type = request.form.get('noise_type', 'gaussian')
    if noise_type not in NOISE_FUNCTIONS:
        noise_type = 'gaussian'

    image_bytes   = request.files['image'].read()
    arr_128, orig_big = preprocess(image_bytes)

    # Apply selected noise
    noisy_128 = NOISE_FUNCTIONS[noise_type](arr_128)

    # Run through denoising autoencoder
    denoised_128 = model.predict(
        noisy_128.reshape(1, 128, 128, 1), verbose=0
    )[0]
    denoised_128 = np.clip(denoised_128, 0.0, 1.0)

    # Compute quality metrics (squeeze for 2D comparison)
    clean_2d    = arr_128.squeeze()
    noisy_2d    = noisy_128.squeeze()
    denoised_2d = denoised_128.squeeze()

    psnr_before = float(psnr(clean_2d, noisy_2d,    data_range=1.0))
    psnr_after  = float(psnr(clean_2d, denoised_2d, data_range=1.0))
    ssim_before = float(ssim(clean_2d, noisy_2d,    data_range=1.0))
    ssim_after  = float(ssim(clean_2d, denoised_2d, data_range=1.0))
    mse_before  = float(np.mean((clean_2d - noisy_2d)**2))
    mse_after   = float(np.mean((clean_2d - denoised_2d)**2))

    return jsonify({
        # Images as base64 PNG strings
        'original_img':    pil_to_b64(orig_big),
        'noisy_img':       arr_to_b64(noisy_128),
        'denoised_img':    arr_to_b64(denoised_128),
        'heatmap_img':     make_diff_heatmap(arr_128, denoised_128),

        # Metrics
        'psnr_before':     round(psnr_before, 2),
        'psnr_after':      round(psnr_after,  2),
        'psnr_gain':       round(psnr_after - psnr_before, 2),
        'ssim_before':     round(ssim_before, 4),
        'ssim_after':      round(ssim_after,  4),
        'ssim_gain':       round(ssim_after - ssim_before, 4),
        'mse_before':      round(mse_before,  6),
        'mse_after':       round(mse_after,   6),
        'noise_reduction': round((1 - mse_after / mse_before) * 100, 1),
        'noise_type':      noise_type,
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)