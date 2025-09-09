# 📦 Dobby Storage

Dobby Storage is built with **Next.js, Prisma, MongoDB, and ImageKit**.
It allows users to create folders (including nested folders), upload and manage images, and search files easily.

---

## 🚀 Features

- 🔐 **Authentication** (Register, Login, Logout)
- 📁 **Folder System** (create nested folders per user)
- 🖼️ **Image Uploads** with [ImageKit](https://imagekit.io/)
- 🔍 **Search Images** by name
- 🗑️ **Delete Folders / Images**
- 🎨 **Modern UI** built with Next.js & Tailwind CSS

---

## 🛠️ Tech Stack

- **Next.js 15 (App Router)**
- **TypeScript**
- **Prisma ORM**
- **MongoDB** (via Prisma adapter)
- **ImageKit** (cloud image storage & CDN)
- **Tailwind CSS** (UI styling)
- **Lucide Icons** (icons)

---

## ⚙️ Environment Variables

Create a **\`.env\`** file in the root with:

```env
DATABASE_URL="your_mongo_connection_string"
IMAGEKIT_PUBLIC_KEY="your_public_key"
IMAGEKIT_PRIVATE_KEY="your_private_key"
IMAGEKIT_PUBLIC_URL_ENDPOINT="your_url_endpoint"
JWT_SECRET="your_jwt_secret"
```

---

## ▶️ Getting Started

1. **Clone the repo**

   ```bash
   git clone https://github.com/syedfaizan8/dobby.git
   cd dobby-storage
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup Prisma**

   ```bash
   npx prisma db push
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) 🚀

---

## 🔑 Usage

- Register/Login to create your account
- Create folders and nested folders
- Upload images into specific folders
- Search images by name
- Delete files/folders when needed

---
