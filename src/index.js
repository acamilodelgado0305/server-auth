import express from 'express';
import dotenv from 'dotenv';
import router from './routes/users.routes.js';
import cors from 'cors'; // Importa cors de manera consistente con ES6

dotenv.config();

const app = express();
app.use(express.json());

// Configura CORS antes de tus rutas
app.use(cors({
    origin: ['http://localhost:5173', 'https://lanet.app.la-net.co'],
    credentials: true,
}));

app.use('/api', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
