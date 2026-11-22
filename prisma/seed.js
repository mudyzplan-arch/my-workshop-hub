// Fills the database with an admin, a demo user and 3 example workshops.
// Run:  npm run db:seed
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();
const inDays = (d) => new Date(Date.now() + d * 86400000);

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@workshophub.co.ke" }, update: {},
    create: { fullName: "Hub Admin", phone: "0700000000", email: "admin@workshophub.co.ke",
      passwordHash: await bcrypt.hash("Admin@123", 10), role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "demo@workshophub.co.ke" }, update: {},
    create: { fullName: "Demo Parent", phone: "0712345678", email: "demo@workshophub.co.ke",
      passwordHash: await bcrypt.hash("Demo@123", 10), role: "USER" },
  });

  if ((await prisma.workshop.count()) > 0) return console.log("Workshops already seeded.");

  await prisma.workshop.createMany({ data: [
    { title: "Robotics for Kids", priceKes: 2500, date: inDays(10), location: "Nairobi", maxSeats: 20,
      instructor: "Eng. Wanjiru Kamau",
      imageUrl: "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=1200",
      description: "A hands-on weekend where kids aged 8-13 build and program their own small robot. No experience needed.",
      learn: "How motors, sensors and batteries work\nBuilding a robot from a kit\nBlock-based programming\nTeamwork and problem solving",
      schedule: "9:00 AM - Welcome and robot basics\n10:30 AM - Build your robot\n1:00 PM - Lunch break\n2:00 PM - Programming challenges\n4:00 PM - Robot showdown" },
    { title: "Web Development Bootcamp", priceKes: 5000, date: inDays(17), location: "Nairobi / Online", maxSeats: 30,
      instructor: "Brian Otieno",
      imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
      description: "Go from zero to your first live website in one intensive day. Attend in person or join online.",
      learn: "HTML and CSS fundamentals\nMaking sites mobile-friendly\nJavaScript basics\nPublishing your site for free",
      schedule: "9:00 AM - HTML and CSS\n11:30 AM - Responsive layouts\n1:00 PM - Lunch break\n2:00 PM - JavaScript basics\n4:00 PM - Publish your site" },
    { title: "AI & Coding for Teens", priceKes: 3500, date: inDays(24), location: "Kajiado", maxSeats: 25,
      instructor: "Faith Naserian",
      imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200",
      description: "Teens aged 13-18 learn Python and build a simple AI project they can show friends and family.",
      learn: "Python from scratch\nHow machine learning works\nTraining a small image classifier\nUsing AI tools responsibly",
      schedule: "9:00 AM - Intro to Python\n11:00 AM - What is AI?\n1:00 PM - Lunch break\n2:00 PM - Build an AI project\n4:00 PM - Demo time" },
  ]});
  console.log("Seeded. Admin: admin@workshophub.co.ke / Admin@123");
}
main().finally(() => prisma.$disconnect());
