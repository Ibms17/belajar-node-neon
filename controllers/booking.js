const bookingService = require('../services/booking.js');
const bookingSchema = require('../validators/booking.js');

// 1. CREATE booking
const create = async (req, res) => {
    // Validasi format input menggunakan Zod
    const validation = bookingSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }
    // Ambil ownerId dari JWT Token (disuplai oleh middleware auth)
    const ownerId = req.user.id;

    // Kirim data ke service. Jika ada throw error di service, otomatis ditangkap global handler
    const newBooking = await bookingService.createBooking({ ...validation.data, ownerId });

    return res.status(201).json({ success: true, message: "Tipe kamar berhasil dibuat", data: newBooking });
};

// 2. READ ALL booking
const getAll = async (req, res) => {
    const bookings = await bookingService.getAllBooking(req.query);
    return res.status(200).json({ success: true, data: bookings });
};

// 3. READ ONE booking
const getById = async (req, res) => {
    const { id } = req.params; // ID berupa string UUID langsung (Tanpa fungsi Number)
    const booking = await bookingService.getBookingById(id);
    return res.status(200).json({ success: true, data: booking });
};

// 4. UPDATE booking
const update = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    const validation = bookingSchema.safeParse(req.body);
    if (!validation.success) {
        const errorPesan = validation.error.issues.map(issue => issue.message).join(", ");
        return res.status(400).json({ success: false, error: errorPesan });
    }

    // Kirim ID booking, ownerId untuk cek kepemilikan, dan data baru ke service
    const updatedBooking = await bookingService.updateBooking(id, ownerId, validation.data);
    return res.status(200).json({ success: true, message: "Tipe kamar berhasil diperbarui", data: updatedBooking });
};

// 5. DELETE booking
const destroy = async (req, res) => {
    const { id } = req.params;
    const ownerId = req.user.id;

    await bookingService.deleteBooking(id, ownerId);
    return res.status(200).json({ success: true, message: "Tipe kamar berhasil dihapus secara permanen" });
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    destroy
};