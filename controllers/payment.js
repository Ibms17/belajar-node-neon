const paymentService = require('../services/payment.js');
const paymentSchema = require('../validators/payment.js');

// 1. CREATE payment
const create = async (req, res) => {
    // Validasi format input menggunakan Zod
    const validation = paymentSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }
    // Ambil ownerId dari JWT Token (disuplai oleh middleware auth)
    const ownerId = req.user.id;

    // Kirim data ke service. Jika ada throw error di service, otomatis ditangkap global handler
    const newPayment = await paymentService.createPayment({ ...validation.data, ownerId });

    return res.status(201).json({ success: true, message: "Tipe kamar berhasil dibuat", data: newPayment });
};

// 2. READ ALL payment
const getAll = async (req, res) => {
    const payments = await paymentService.getAllPayment(req.query);
    return res.status(200).json({ success: true, data: payments });
};

// 3. READ ONE payment
const getById = async (req, res) => {
    const { id } = req.params; // ID berupa string UUID langsung (Tanpa fungsi Number)
    const payment = await paymentService.getPaymentById(id);
    return res.status(200).json({ success: true, data: payment });
};

// 4. UPDATE payment
const update = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    const validation = paymentSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }

    // Kirim ID payment, ownerId untuk cek kepemilikan, dan data baru ke service
    const updatedPayment = await paymentService.updatePayment(id, ownerId, validation.data);
    return res.status(200).json({ success: true, message: "Tipe kamar berhasil diperbarui", data: updatedPayment });
};

// 5. DELETE payment
const destroy = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    await paymentService.deletePayment(id, ownerId);
    return res.status(200).json({ success: true, message: "Tipe kamar berhasil dihapus secara permanen" });
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    destroy
};