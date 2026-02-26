import app from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`🚀  API is live at http://localhost:${PORT}`);
    console.log(`✨ Welcome to Agrisoko, where farmers connect without middlemen.`);
});

