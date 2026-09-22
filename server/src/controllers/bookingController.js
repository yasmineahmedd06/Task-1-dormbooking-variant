import Joi from 'joi';
import { Booking } from '../models/Booking.js';

const createSchema = Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  purpose: Joi.string().optional(),
  bookedBy: Joi.string().optional()
});

const updateSchema = Joi.object({
  roomNumber: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date(),
  purpose: Joi.string(),
  bookedBy: Joi.string()
}).min(1);

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate(
      'bookedBy',
      'name email'
    );

    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get bookings'
    });
  }
};

export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      'bookedBy',
      'name email'
    );

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }

    return res.status(200).json(booking);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get booking'
    });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    const { roomNumber, startDate, endDate } = value;

    const conflict = await Booking.findOne({
      roomNumber,
      startDate: { $lt: endDate },
      endDate: { $gt: startDate }
    });

    if (conflict) {
      return res.status(409).json({
        message: 'Booking conflicts with an existing booking'
      });
    }

    const booking = await Booking.create(value);

    return res.status(201).json(booking);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create booking'
    });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { error, value } = updateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }

    const roomNumber = value.roomNumber ?? booking.roomNumber;
    const startDate = value.startDate ?? booking.startDate;
    const endDate = value.endDate ?? booking.endDate;

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: 'startDate must be before endDate'
      });
    }

    const conflict = await Booking.findOne({
      _id: { $ne: req.params.id },
      roomNumber,
      startDate: { $lt: endDate },
      endDate: { $gt: startDate }
    });

    if (conflict) {
      return res.status(409).json({
        message: 'Booking conflicts with an existing booking'
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true }
    );

    return res.status(200).json(updatedBooking);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update booking'
    });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: 'Booking not found'
      });
    }

    return res.status(200).json({
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete booking'
    });
  }
};