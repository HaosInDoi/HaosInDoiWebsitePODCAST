const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");

let cachedDb = null;

async function connectDB() {
    if (cachedDb) return cachedDb;

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();

    cachedDb = client.db(process.env.DB_NAME || "HaosInDoiDB");
    return cachedDb;
}

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { name, email, proposalType, proposal } = req.body;

        if (!name || !email || !proposalType || !proposal) {
            return res.json({
                success: false,
                error: "Toate câmpurile sunt obligatorii."
            });
        }

        const db = await connectDB();
        await db.collection("Propuneri").insertOne({
            name,
            email,
            proposalType,
            proposal,
            date: new Date()
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "haosindoi@gmail.com",
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: email,
            to: "haosindoi@gmail.com",
            subject: `💡 Nouă propunere: ${proposalType}`,
            text: `Nume: ${name}\nEmail: ${email}\nTip: ${proposalType}\n\n${proposal}`
        });

        return res.json({ success: true });

    } catch (err) {
        console.error("PROPUNERI API ERROR:", err);
        return res.status(500).json({
            success: false,
            error: "Eroare server."
        });
    }
};