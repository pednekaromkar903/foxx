const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testLogin() {
    const email = 'admin@atomberg.com';
    const password = 'Admin@123';
    
    // Using port 5433 as per docker-compose
    const connectionString = 'postgresql://postgres:password123@localhost:5433/goal_portal';
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: connectionString
            }
        }
    });

    const user = await prisma.user.findUnique({
        where: { email },
    });
    
    console.log('User:', user?.email);
    console.log('Password in DB:', user?.password);
    
    if (user && user.password) {
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValid);
    } else {
        console.log('User not found or no password');
    }
}

testLogin().then(() => prisma.$disconnect());
