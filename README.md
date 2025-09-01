# Notesy 📝

A full-stack personal notes application with advanced image management, search capabilities, and modern UI design. Built with React, Node.js, and MongoDB.

![Notesy Logo](https://via.placeholder.com/800x200/3B82F6/FFFFFF?text=Notesy+-+Personal+Notes+App)

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based user registration and login
- 📝 **Rich Note Management** - Create, edit, delete notes with full CRUD operations
- 🖼️ **Smart Image Upload** - Add screenshots with automatic compression and optimization
- 🔍 **Advanced Search** - Full-text search across all your notes
- 🏷️ **Organization** - Categories and tags for better note organization
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🎨 **Split-Screen Viewer** - Beautiful image viewing experience
- ⚡ **Performance Optimized** - Image compression and parallel uploads
- 🌐 **Cloud Storage** - Reliable image hosting with Cloudinary

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Beautiful hand-crafted SVG icons
- **Axios** - HTTP client for API requests

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **Multer** - File upload middleware
- **Cloudinary** - Cloud image storage and optimization

### Deployment
- **Frontend**: Netlify
- **Backend**: Render
- **Database**: MongoDB Atlas
- **Images**: Cloudinary

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Cloudinary** account for image storage

## 🛠️ Installation

### 1. Clone the Repository
git clone https://github.com/Namanraj-v/notesy-app.git
cd notesy-app

### 2. Backend Setup
cd server
npm install

Create `server/.env`:
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/notesy
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

### 3. Frontend Setup
cd ../client
npm install

Create `client/.env`:
VITE_API_BASE_URL=http://localhost:5000/api

### 4. Database Setup

**Option A: Local MongoDB**
1. Install MongoDB Community Edition
2. Start MongoDB service: `mongod`

**Option B: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create cluster and get connection string
3. Update `MONGODB_URI` in server/.env

### 5. Cloudinary Setup
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Copy Cloud Name, API Key, and API Secret from dashboard
3. Add to server/.env file

## 🚀 Running the Application

**Start Backend (Terminal 1):**
cd server
npm run dev
Server runs on `http://localhost:5000`

**Start Frontend (Terminal 2):**
cd client
npm run dev
Frontend runs on `http://localhost:5173`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Notes
- `GET /api/notes` - Get all notes (with search/filter support)
- `POST /api/notes` - Create note (with image upload)
- `PUT /api/notes/:id` - Update note (preserves existing images)
- `DELETE /api/notes/:id` - Delete note and associated images
- `GET /api/notes/:id` - Get specific note

### Query Parameters for GET /api/notes
- `search` - Search in title, content, and tags
- `category` - Filter by category (General, Work, Personal, Ideas, Important)
- `tags` - Filter by tags (comma-separated)

Example: `/api/notes?search=meeting&category=Work&tags=important`

## 📁 Project Structure

notesy-app/
├── client/ # React frontend
│ ├── src/
│ │ ├── components/ # UI components
│ │ ├── contexts/ # React contexts
│ │ ├── pages/ # Page components
│ │ ├── services/ # API services
│ │ └── App.jsx
│ └── package.json
├── server/ # Node.js backend
│ ├── config/ # Configuration
│ ├── middleware/ # Express middleware
│ ├── models/ # Mongoose models
│ ├── routes/ # API routes
│ ├── server.js
│ └── package.json
└── README.md


## 🧪 Testing Checklist

- [ ] User registration and login
- [ ] Create notes with text and images
- [ ] Edit notes (existing images preserved)
- [ ] Delete notes
- [ ] Search functionality
- [ ] Category and tag filtering
- [ ] Image compression and upload
- [ ] Split-screen image viewer
- [ ] Mobile responsiveness

## 🚀 Deployment

### Backend (Render.com)
1. Push to GitHub
2. Create Web Service on Render
3. Connect repository
4. Add environment variables
5. Deploy

### Frontend (Netlify.com)  
1. Build: `npm run build` in client/
2. Deploy `dist/` folder to Netlify
3. Set `VITE_API_BASE_URL` to production backend URL

## 🔧 Troubleshooting

**CORS Errors:** Check API_BASE_URL in client/.env matches your backend URL

**Image Upload Issues:** 
- Verify Cloudinary credentials
- Check file size (10MB max)
- Ensure uploads/ directory exists

**Database Connection:** 
- Verify MongoDB is running
- Check connection string format
- Ensure network access (Atlas)

## ⚡ Performance Features

- **Client-side image compression** - Reduces 6MB images to ~1MB
- **Parallel uploads** - Multiple images upload simultaneously  
- **Cloudinary optimization** - Auto-format and quality optimization
- **Smart caching** - Efficient data fetching and storage

## 🔮 Future Enhancements

- [ ] Rich text editor
- [ ] Dark mode toggle  
- [ ] Note sharing
- [ ] Export to PDF/Markdown
- [ ] Real-time collaboration
- [ ] Offline support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Naman Raj**
- GitHub: [@Namanraj-v](https://github.com/Namanraj-v)


## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first approach
- Cloudinary for reliable image hosting
- MongoDB for the flexible database

---

**Built with ❤️ using React, Node.js, and MongoDB**

⭐ **Give this project a star if it helped you!**
