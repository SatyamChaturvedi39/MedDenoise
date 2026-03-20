# MedDenoise: Medical Image Denoising

MedDenoise is an AI-powered tool leveraging Convolutional Autoencoders to clean and restore noisy medical chest X-rays. It removes quantum noise and data corruption artifacts to improve diagnostic clarity without exposing patients to higher radiation doses.

## 🌊 User Flow

1. **Upload X-Ray:** The user uploads a medical image (X-ray, CT scan, etc.) via the drag-and-drop interface. The image is resized to 128x128 grayscale for processing.
2. **Select Noise Profile:** The user selects a specific noise corruption to simulate (e.g., Quantum Noise, Severe Noise, Dead Pixels, or Data Loss).
3. **Model Processing:** The Flask backend takes the corrupted image and passes it strictly through the trained Convolutional Denoising Autoencoder bottleneck.
4. **View Reconstruction:** The UI displays the original, corrupted, and reconstructed images side-by-side.
5. **Analyze Error Heatmap:** A visual heatmap highlights the model's structural reconstruction efforts, pointing out critical anatomical boundaries (ribs, lung fields).
6. **Evaluate Metrics:** The Dashboard provides real-time changes in PSNR (Peak Signal-to-Noise Ratio) and SSIM (Structural Similarity Index) to quantify the quality of the denoising.

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js & npm

### Backend Setup (Flask & TensorFlow)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the required Python packages (ensure you are using a virtual environment):
   ```bash
   pip install flask flask-cors Pillow numpy tensorflow scikit-image
   ```
3. Run the Flask server:
   ```bash
   python server.py
   ```
   *The server will start on `http://localhost:5000`.*

### Frontend Setup (React & Vite)
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`.*

## 🧠 Model Architecture
- **Input:** 128x128x1 (Grayscale X-Ray)
- **Architecture:** Convolutional Denoising Autoencoder
- **Bottleneck:** 32x32x128 (Compressed latent representation)
- **Dataset:** Kaggle Chest X-Ray Pneumonia (5,856 real chest X-rays)
