import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean database
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.note.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: "Faiz Admin",
      email: "admin@faizdigital.com",
      passwordHash,
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Sarah Manager",
      email: "manager@faizdigital.com",
      passwordHash,
      role: "SALES_MANAGER",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const salesRep = await prisma.user.create({
    data: {
      name: "Alex Sales",
      email: "sales@faizdigital.com",
      passwordHash,
      role: "SALESPERSON",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("✅ Users created.");

  // 2. Create Companies
  const company1 = await prisma.company.create({
    data: {
      name: "Apex Global Solutions",
      website: "https://apexglobal.com",
      industry: "Enterprise Software",
      phone: "+1 (555) 234-5678",
      email: "info@apexglobal.com",
      address: "100 Tech Parkway, Suite 500, Austin TX",
      ownerId: manager.id,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "Nexus Logistics Corp",
      website: "https://nexuslogistics.io",
      industry: "Supply Chain & Logistics",
      phone: "+1 (555) 876-5432",
      email: "contact@nexuslogistics.io",
      address: "45 Cargo Hub Blvd, Chicago IL",
      ownerId: salesRep.id,
    },
  });

  const company3 = await prisma.company.create({
    data: {
      name: "Vanguard Financial",
      website: "https://vanguardfin.com",
      industry: "Fintech",
      phone: "+1 (555) 345-6789",
      email: "sales@vanguardfin.com",
      address: "1 Wall Street, New York NY",
      ownerId: admin.id,
    },
  });

  console.log("✅ Companies created.");

  // 3. Create Contacts
  const contact1 = await prisma.contact.create({
    data: {
      name: "David Miller",
      email: "david.m@apexglobal.com",
      phone: "+1 (555) 234-5679",
      jobTitle: "VP of Engineering",
      companyId: company1.id,
      source: "LinkedIn",
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      name: "Elena Rostova",
      email: "elena@nexuslogistics.io",
      phone: "+1 (555) 876-5433",
      jobTitle: "Head of Operations",
      companyId: company2.id,
      source: "Referral",
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      name: "Marcus Vance",
      email: "m.vance@vanguardfin.com",
      phone: "+1 (555) 345-6790",
      jobTitle: "Chief Technology Officer",
      companyId: company3.id,
      source: "Conference",
    },
  });

  console.log("✅ Contacts created.");

  // 4. Create Leads
  const lead1 = await prisma.lead.create({
    data: {
      firstName: "Robert",
      lastName: "Chen",
      email: "robert.chen@innovate.tech",
      phone: "+1 (555) 111-2233",
      companyName: "Innovate Tech Labs",
      jobTitle: "CTO",
      source: "Website Form",
      status: "NEW",
      priority: "HIGH",
      estimatedValue: 45000,
      assignedUserId: salesRep.id,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      firstName: "Samantha",
      lastName: "Wright",
      email: "swright@cloudscale.io",
      phone: "+1 (555) 444-5566",
      companyName: "CloudScale Systems",
      jobTitle: "VP Sales",
      source: "LinkedIn Outreach",
      status: "CONTACTED",
      priority: "HIGH",
      estimatedValue: 85000,
      assignedUserId: manager.id,
    },
  });

  await prisma.lead.create({
    data: {
      firstName: "Michael",
      lastName: "Torres",
      email: "mtorres@biohealth.org",
      phone: "+1 (555) 777-8899",
      companyName: "BioHealth Solutions",
      jobTitle: "Director of IT",
      source: "Cold Call",
      status: "QUALIFIED",
      priority: "MEDIUM",
      estimatedValue: 32000,
      assignedUserId: salesRep.id,
    },
  });

  await prisma.lead.create({
    data: {
      firstName: "Anita",
      lastName: "Deshmukh",
      email: "anita@quantumanalytics.com",
      phone: "+1 (555) 999-0011",
      companyName: "Quantum Analytics",
      jobTitle: "Managing Director",
      source: "Google Ads",
      status: "CONVERTED",
      priority: "HIGH",
      estimatedValue: 120000,
      assignedUserId: admin.id,
    },
  });

  console.log("✅ Leads created.");

  // 5. Create Deals
  const deal1 = await prisma.deal.create({
    data: {
      name: "Apex Enterprise Cloud Migration",
      companyId: company1.id,
      contactId: contact1.id,
      value: 150000,
      probability: 75,
      stage: "NEGOTIATION",
      expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      assignedUserId: salesRep.id,
      source: "Inbound Web",
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      name: "Nexus Fleet Tracking Integration",
      companyId: company2.id,
      contactId: contact2.id,
      value: 95000,
      probability: 60,
      stage: "PROPOSAL_SENT",
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      assignedUserId: manager.id,
      source: "Referral",
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      name: "Vanguard Core Banking Upgrade",
      companyId: company3.id,
      contactId: contact3.id,
      value: 280000,
      probability: 90,
      stage: "WON",
      expectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      assignedUserId: admin.id,
      source: "Conference",
    },
  });

  await prisma.deal.create({
    data: {
      name: "CloudScale DevOps Automation",
      value: 65000,
      probability: 30,
      stage: "MEETING",
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      assignedUserId: salesRep.id,
      source: "Outbound",
    },
  });

  console.log("✅ Deals created.");

  // 6. Create Tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Prepare Cloud Migration SOW for Apex",
        description: "Draft scope of work focusing on multi-region AWS setup.",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: "HIGH",
        status: "IN_PROGRESS",
        assignedUserId: salesRep.id,
        dealId: deal1.id,
      },
      {
        title: "Follow up with Samantha on Security Compliance",
        description: "Send SOC2 Type II report documentation.",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        priority: "MEDIUM",
        status: "PENDING",
        assignedUserId: manager.id,
        leadId: lead2.id,
      },
      {
        title: "Schedule Demo Call with Robert Chen",
        description: "Demonstrate automated CI/CD pipeline capabilities.",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        priority: "HIGH",
        status: "PENDING",
        assignedUserId: salesRep.id,
        leadId: lead1.id,
      },
      {
        title: "Finalize Contract Review with Vanguard Legal",
        description: "Confirm payment schedule and SLA terms.",
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        priority: "HIGH",
        status: "COMPLETED",
        assignedUserId: admin.id,
        dealId: deal3.id,
      },
    ],
  });

  console.log("✅ Tasks created.");

  // 7. Create Activities & Notes
  await prisma.activity.createMany({
    data: [
      {
        type: "CALL",
        title: "Initial Discovery Call",
        description: "Discussed current bottlenecks with legacy infrastructure.",
        userId: salesRep.id,
        leadId: lead1.id,
      },
      {
        type: "MEETING",
        title: "Proposal Walkthrough Meeting",
        description: "Presented 3-phase rollout architecture. Feedback was strong.",
        userId: manager.id,
        dealId: deal2.id,
      },
      {
        type: "EMAIL",
        title: "Sent Contract & Pricing Schedule",
        description: "Emailed final terms to Marcus Vance.",
        userId: admin.id,
        dealId: deal3.id,
      },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        content: "Client requested 24/7 dedicated support SLA in final proposal.",
        userId: salesRep.id,
        dealId: deal1.id,
      },
      {
        content: "Decision maker preferred quarterly billing instead of annual upfront.",
        userId: manager.id,
        leadId: lead2.id,
      },
    ],
  });

  console.log("✅ Activities & Notes created.");

  // 8. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: salesRep.id,
        message: 'New lead: Robert Chen added to your pipeline.',
        link: "/leads",
      },
      {
        userId: salesRep.id,
        message: 'Deal "Apex Enterprise Cloud Migration" moved to Negotiation.',
        link: "/deals",
      },
      {
        userId: salesRep.id,
        message: 'Task "Prepare Cloud Migration SOW" is due soon.',
        link: "/tasks",
      },
      {
        userId: manager.id,
        message: "Samantha Wright was contacted today.",
        link: "/leads",
      },
      {
        userId: admin.id,
        message: "Vanguard Core Banking Upgrade deal closed (Won).",
        link: "/deals",
      },
    ],
  });

  console.log("✅ Notifications created.");
  console.log("🚀 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
