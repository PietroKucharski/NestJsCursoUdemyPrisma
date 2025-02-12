import { BadRequestException } from '@nestjs/common';
import { UserService } from './../user/user.service';
import { AuthRegisterDTO } from './dtos/auth-register.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer/dist';

@Injectable()
export class AuthService {
    private issuer = 'login'
    private audience = 'users'

    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
        private userService: UserService,
        private mailer: MailerService
        
    ) {}

    createToken(user: User) {
        return {
            accessToken: this.jwtService.sign({
                id: user.id,
                name: user.name,
                email: user.email
            }, {
                expiresIn: '1 day',
                subject: String(user.id),
                issuer: this.issuer,
                audience: this.audience
            })
        }
    }

    checkToken(token: string) {
        try {
            const data = this.jwtService.verify(token, {
                issuer: this.issuer,
                audience: this.audience
            });

            return data
        } catch (e) {
            throw new BadRequestException(e)
        }
    }

    isValidToken(token: string) {
        try {
            this.checkToken(token);
            return true;
        } catch (e) {
            return false;
        }
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                email
            },
        });

        if(!user) {
            throw new NotFoundException('Email e/ou senha incorretos')
        }

        if(!await bcrypt.compare(password, user.password)) {
            throw new NotFoundException('Email e/ou senha incorretos')
        }

        return this.createToken(user);
    }

    async forget(email: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                email 
            },
        });

        if(!user) {
            throw new NotFoundException('Email está incorretos')
        }

        const token = this.jwtService.sign({
            id: user.id,
        }, {
            expiresIn: '30 minutes',
            subject: String(user.id),
            issuer: 'forget',
            audience: 'users'
        });

        await this.mailer.sendMail({
            subject: 'Recuperação de senha',
            to: 'pietrokucharski@hotmail.com',
            template: 'forget',
            context: {
                name: user.name,
                token, 
            }
        })

        return user;
    }

    async reset(password: string, token: string) {
        try {
            const data: any = this.jwtService.verify(token, {
                issuer: 'forget',
                audience: 'users'
            });

            if(isNaN(Number(data.id))) {
                throw new BadRequestException('Token é inválido')
            }

            const salt = await bcrypt.genSalt()
            password = await bcrypt.hash(password, salt);

            const user = await this.prisma.user.update({
                where: {
                    id: Number(data.id),
                },
                data: {
                    password
                }
            });
    
            return this.createToken(user);
        } catch (e) {
            throw new BadRequestException(e)
        }


    }

    async register(data: AuthRegisterDTO) {
        const user = await this.userService.create(data)

        return this.createToken(user)
    }

    
}