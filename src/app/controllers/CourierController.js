import * as Yup from 'yup';

import User from '../models/User';
import File from '../models/File';

class CourierController {
    async index({ res }) {
        const couriers = await User.findAll({
            where: { admin: false },
        });

        return res.json(couriers);
    }

    async store(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string().required(),
            email: Yup.string()
                .email()
                .required(),
            password: Yup.string()
                .min(6)
                .required(),
            avatar_id: Yup.number().required(),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        const { avatar_id } = req.body;

        const courierExists = await User.findOne({
            where: { email: req.body.email },
        });

        if (courierExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const isAvatar = await File.findOne({
            where: { id: avatar_id, signature: false },
        });

        if (!isAvatar) {
            return res.status(400).json({ error: 'Avatar does not exists' });
        }

        const { id, name, email } = await User.create(req.body);
        return res.json({
            user: {
                id,
                name,
                email,
            },
        });
    }

    async update(req, res) {
        const schema = Yup.object().shape({
            name: Yup.string(),
            email: Yup.string().email(),
            oldPassword: Yup.string(),
            password: Yup.string()
                .min(6)
                .when('oldPassword', (oldPassword, field) =>
                    oldPassword ? field.required() : field
                ),
            confirmPassword: Yup.string().when('password', (password, field) =>
                password ? field.required().oneOf([Yup.ref('password')]) : field
            ),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Validation fails' });
        }

        const { email, oldPassword } = req.body;

        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(400).json({ error: 'Courier does not exists' });
        }

        if (email) {
            const courierExists = await User.findOne({ where: { email } });

            if (courierExists) {
                return res
                    .status(400)
                    .json({ error: 'Email already exists, try another' });
            }
        }

        if (oldPassword && !(await user.checkPassword(oldPassword))) {
            return res.status(401).json({ error: 'Password does not match' });
        }

        const { id, name } = await user.update(req.body);

        return res.json({
            id,
            name,
            email,
        });
    }

    async destroy(req, res) {
        const courier = await User.findOne({
            where: { id: req.params.id },
        });

        if (!courier) {
            return res.status(400).json({ error: 'Courier does not exists ' });
        }

        await courier.destroy();

        return res.send();
    }
}

export default new CourierController();
