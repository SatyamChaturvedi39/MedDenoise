# 🩻 MedDenoise — Medical Image Denoising System

A deep learning-powered web application that removes noise and artifacts from medical chest X-rays using a Convolutional Denoising Autoencoder, served via a Flask backend and a React frontend.

---

## Problem Statement

Medical imaging equipment, especially portable and low-cost X-ray machines used in rural clinics and field hospitals, produce inherently noisy images due to lower radiation doses. This noise (often quantum noise) can obscure critical diagnostic features, such as hairline fractures, early-stage pneumonia opacities, and subtle nodules, potentially leading to misdiagnosis. MedDenoise addresses this by using AI to clean corrupted images, potentially allowing doctors to reduce radiation exposure (low-dose protocols) without sacrificing diagnostic quality.

---

## What This Project Does

MedDenoise takes a medical image as input and:

1. Synthetically simulates real-world clinical noise (Quantum Noise, Dead Pixels, Data Loss).
2. Uses a deep Convolutional Autoencoder to reconstruct a clean version of the image.
3. Computes objective image quality metrics (PSNR, SSIM, MSE, Noise Reduction %) in real-time.
4. Generates an Error Heatmap showing exactly which anatomical regions the model had to work hardest to reconstruct (e.g., rib margins, lung field boundaries).
5. Displays a visual Dashboard with bar charts comparing noisy vs. denoised metric performance.

---

## Project Flow

```text
User uploads medical image (drag & drop or file browser)
  ↓
User selects noise profile (e.g., Gaussian/Quantum Noise)
  ↓
React frontend sends image & noise selection to Flask backend via POST /api/denoise
  ↓
Backend preprocesses image: convert to grayscale, resize to 128×128, normalize to [0, 1]
  ↓
Backend applies selected noise function mathematically (e.g., x + N(0, σ²))
  ↓
Conv-AE model runs inference → outputs reconstructed 128×128 grayscale image
  ↓
Backend computes PSNR, SSIM, and pixel-wise difference heatmap
  ↓
Backend converts arrays to Base64 PNGs and formats JSON response
  ↓
React frontend displays: Original, Noisy, Denoised, Heatmap, and comparison metrics
```

---

## Dataset Details

| Property | Details |
| :--- | :--- |
| **Name** | Chest X-Ray Images (Pneumonia) |
| **Source** | Kaggle — paultimothymooney (Guangzhou Women and Children's Medical Center) |
| **Link** | [https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia](https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia) |
| **Total Images** | 5,856 pediatric chest X-ray images |
| **Classes** | NORMAL and PNEUMONIA cases (creates a diverse anatomical landscape) |
| **Image Size** | Originally ~1000×1000, resized to 128×128 during processing |

---

## Model Architecture

The model uses a **Convolutional Denoising Autoencoder**. 

### Why a Conv-AE?
- **Convolutional layers** preserve spatial structures — X-rays have strong spatial patterns (ribs, lung boundaries) that dense networks would destroy.
- **Autoencoder compression** forces the network to learn a compact representation ("atlas") of healthy chest anatomy. Since random noise is highly incompressible, the bottleneck discards it, and the decoder reconstructs a clean image from the latent features.

### Architecture Stack

```text
Input (128 × 128 × 1)
  ↓
Conv2D (32 filters, 3×3, ReLU + BatchNorm)
MaxPool2D (64 × 64 × 32) — halves spatial dimensions
  ↓
Conv2D (64 filters, 3×3, ReLU + BatchNorm)
MaxPool2D (32 × 32 × 64) — halves again
  ↓
Conv2D (128 filters, 3×3, ReLU + BatchNorm)
Bottleneck (32 × 32 × 128) — Compressed representation (131,072 latent values)
  ↓
Conv2D (64 filters, 3×3, ReLU + BatchNorm)
UpSampling2D (64 × 64 × 64) — doubles spatial dimensions
  ↓
Conv2D (32 filters, 3×3, ReLU + BatchNorm)
UpSampling2D (128 × 128 × 32) — restore original size
  ↓
Output Conv2D (1 filter, 3×3, Sigmoid)
Output: Clean grayscale reconstruction (128 × 128 × 1)
```

---

## Parameter Summary

| Component | Parameters | Trainable |
| :--- | :--- | :--- |
| **Encoder Blocks** | ~84,000 | Yes |
| **Bottleneck** | ~74,000 | Yes |
| **Decoder Blocks** | ~28,000 | Yes |
| **Total** | **186,497** | **186,497** |

---

## How the Model Was Trained (Google Colab)

The model was trained on Google Colab using a free T4 GPU. 

**Training Steps:**
1. Loaded full-resolution dataset via `kagglehub`.
2. Resized images to 128×128 and normalized them to `[0, 1]`.
3. Created highly corrupted targets `x_noisy` by adding Gaussian noise (`σ=0.3`).
4. Compiled model with **MSE Loss** and **Adam Optimizer**.
5. Trained using `EarlyStopping` (patience=7) and `ReduceLROnPlateau`.
6. Saved the finalized weights as a Keras `.h5` file.

### Why `.h5` format?
The `.h5` (HDF5) format saves the entire Keras model including architecture, weights, and optimizer state. This allows the Flask backend to instantiate and run predictions instantly without needing the original model code or retraining.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Model Training** | TensorFlow / Keras | Build and train the autoencoder |
| **Backend** | Flask (Python) | REST API serving predictions |
| **Model Serving** | TensorFlow + NumPy | Load `.h5` model and apply noise |
| **Backend Imaging** | Pillow + scikit-image | Image preprocessing & PSNR/SSIM evaluation |
| **Frontend** | React + Vite | User interface |
| **Charts/Graphs** | Recharts | Render interactive dashboard metrics |

---

## How the Backend Connects to the Frontend

```text
React Frontend (localhost:5173)
  | 
  | POST /api/denoise
  | Content-Type: multipart/form-data
  | Body: { image: <file>, noise_type: "gaussian" }
  |
  ↓
Flask Backend (localhost:5000)
  |
  | 1. Reads uploaded image bytes via io.BytesIO
  | 2. Opens with Pillow, converts to Grayscale ('L' mode)
  | 3. Resizes to 128×128 and normalizes to [0, 1]
  | 4. Synthetically applies user-selected noise
  | 5. Runs model.predict() on noisy input
  | 6. Evaluates PSNR, SSIM, MSE using scikit-image
  | 7. Computes pixel-wise error heatmap
  | 8. Converts numpy arrays back to Base64 PNGs
  |
  ↓
JSON Response:
{
  "original_img": "...",
  "noisy_img": "...",
  "denoised_img": "...",
  "heatmap_img": "...",
  "psnr_before": 11.84,
  "psnr_after": 25.83,
  "ssim_before": 0.10,
  "ssim_after": 0.73,
  "noise_reduction": 95.8
}
  |
  ↓
React updates state and renders images, metrics, and heatmap
```

*(CORS is enabled in `server.py` to allow requests from `localhost:5173`)*

---

## Implementation Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+

*(Note: Ensure `denoising_autoencoder.h5` and `metrics.json` are present in the `backend/` directory)*

### Step 1 — Start the Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install flask flask-cors Pillow numpy tensorflow scikit-image
python server.py
```
*Verify API running at `http://localhost:5000`*

### Step 2 — Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Open application at `http://localhost:5173`*
