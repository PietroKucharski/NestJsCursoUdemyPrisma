import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService
        
    ) {}

    async createToken() {
        // return this.jwtService.sign()
    }

    async checkToken() {
        // return this.jwtService.verify()
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                email,
                password
            },
        });

        if(!user) {
            throw new NotFoundException('Email e/ou senha incorretos')
        }

        return user;
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

        return user;
    }

    async reset(password: string, token: string) {
        const id = 0

        await this.prisma.user.update({
            where: {
                id
            },
            data: {
                password
            }
        });

        return true;
    }

    
}