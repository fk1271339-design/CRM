export interface LeadTemplate {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  industry: string;
  jobTitle: string;
  source: string;
  estimatedValue: number;
  priority: "LOW" | "MEDIUM" | "HIGH";
  requirement: string;
  timeline: string;
}

/**
 * Pool of realistic Indian B2B/B2C sales enquiries for Faiz Digital Solutions.
 * Each day 5 templates are picked deterministically (same day → same batch),
 * guaranteeing "one daily run = five leads, no duplicates on refresh".
 */
export const LEAD_POOL: LeadTemplate[] = [
  { firstName: "Rahul", lastName: "Mehta", email: "rahul.mehta@sharmadental.in", phone: "+91 98200 11231", companyName: "Sharma Dental Care", industry: "Healthcare", jobTitle: "Owner", source: "Website Form", estimatedValue: 45000, priority: "HIGH", requirement: "5-page clinic website with appointment booking, doctor profiles and WhatsApp integration.", timeline: "2-3 weeks" },
  { firstName: "Aditi", lastName: "Verma", email: "aditi@urbanfashionstudio.in", phone: "+91 88790 22341", companyName: "Urban Fashion Studio", industry: "Fashion", jobTitle: "Founder", source: "Instagram", estimatedValue: 85000, priority: "MEDIUM", requirement: "E-commerce fashion website with Razorpay payment gateway, order tracking and catalogue.", timeline: "3-4 weeks" },
  { firstName: "Priya", lastName: "Nair", email: "priya@spicekitch.in", phone: "+91 98470 33622", companyName: "Spice Kitch Restaurant", industry: "Restaurant", jobTitle: "Director", source: "Google", estimatedValue: 32000, priority: "MEDIUM", requirement: "Restaurant website with online table reservations and digital menu display.", timeline: "2 weeks" },
  { firstName: "Arjun", lastName: "Singhania", email: "arjun@pristine-properties.in", phone: "+91 98330 44789", companyName: "Pristine Properties", industry: "Real Estate", jobTitle: "MD", source: "LinkedIn", estimatedValue: 120000, priority: "HIGH", requirement: "Property listing portal with enquiry capture, photo galleries and WhatsApp lead form.", timeline: "5-6 weeks" },
  { firstName: "Sneha", lastName: "Kulkarni", email: "sneha@brightfuturecoaching.in", phone: "+91 98220 55123", companyName: "Bright Future Coaching", industry: "Education", jobTitle: "Director", source: "Facebook", estimatedValue: 28000, priority: "LOW", requirement: "Coaching institute website with student registration forms and results showcase.", timeline: "2 weeks" },
  { firstName: "Vikram", lastName: "Rathore", email: "vikram@luminarhospitals.in", phone: "+91 98110 66290", companyName: "Luminar Hospital", industry: "Healthcare", jobTitle: "CEO", source: "Website Form", estimatedValue: 90000, priority: "HIGH", requirement: "Hospital website with doctor profiles, online OPD appointment and health packages.", timeline: "3-4 weeks" },
  { firstName: "Kavita", lastName: "Joshi", email: "kavita@fitlifegym.in", phone: "+91 99090 77431", companyName: "FitLife Gym", industry: "Fitness", jobTitle: "Owner", source: "Instagram", estimatedValue: 24000, priority: "MEDIUM", requirement: "Gym website with membership plans, class schedules and lead capture form.", timeline: "10 days" },
  { firstName: "Mohammed", lastName: "Iqbal", email: "iqbal@greenleaflogistics.in", phone: "+91 98450 88542", companyName: "GreenLeaf Logistics", industry: "Logistics", jobTitle: "Operations Head", source: "Google Ads", estimatedValue: 150000, priority: "HIGH", requirement: "Logistics company website with fleet showcase and shipment enquiry system.", timeline: "6 weeks" },
  { firstName: "Ritu", lastName: "Kapoor", email: "ritu@essentiawellness.in", phone: "+91 98970 99312", companyName: "Essentia Wellness", industry: "Healthcare", jobTitle: "Director", source: "Referral", estimatedValue: 55000, priority: "MEDIUM", requirement: "Wellness centre website with therapist profiles, session booking and packages.", timeline: "3 weeks" },
  { firstName: "Deepak", lastName: "Tiwari", email: "deepak@tandoorhouse.in", phone: "+91 97170 11023", companyName: "Tandoor House", industry: "Restaurant", jobTitle: "Owner", source: "WhatsApp", estimatedValue: 38000, priority: "HIGH", requirement: "Restaurant website with online ordering and table booking for a quick-service chain.", timeline: "2-3 weeks" },
  { firstName: "Ananya", lastName: "Gupta", email: "ananya@girlpawer.in", phone: "+91 99710 22440", companyName: "Girl Pawer", industry: "Fashion", jobTitle: "Founder", source: "Instagram", estimatedValue: 72000, priority: "MEDIUM", requirement: "D2C fashion brand store with lookbook, SizeGPT assistant and COD orders.", timeline: "4 weeks" },
  { firstName: "Suresh", lastName: "Patel", email: "suresh@centralpharma.in", phone: "+91 99980 33984", companyName: "Central Pharma", industry: "Pharma", jobTitle: "Managing Partner", source: "Cold Call", estimatedValue: 65000, priority: "LOW", requirement: "Pharmaceutical distributor website with product research and dealer enquiries.", timeline: "3 weeks" },
  { firstName: "Neha", lastName: "Sharma", email: "neha@bloomingideas.in", phone: "+91 90040 44671", companyName: "Blooming Ideas", industry: "Marketing", jobTitle: "Creative Head", source: "Website Form", estimatedValue: 41000, priority: "MEDIUM", requirement: "Agency portfolio website with case studies, services and contact form.", timeline: "2-3 weeks" },
  { firstName: "Rajesh", lastName: "Menon", email: "rajesh@cochinrealty.in", phone: "+91 98474 55890", companyName: "Cochin Realty", industry: "Real Estate", jobTitle: "Partner", source: "LinkedIn", estimatedValue: 98000, priority: "HIGH", requirement: "Real estate portal for premium villas with virtual tours and CRM integration.", timeline: "5 weeks" },
  { firstName: "Pooja", lastName: "Iyer", email: "pooja@vedamayuraspa.in", phone: "+91 98860 66201", companyName: "VedaMayura Spa", industry: "Wellness", jobTitle: "Owner", source: "Instagram", estimatedValue: 29000, priority: "LOW", requirement: "Spa and salon website with service menu, pricing and advance bookings.", timeline: "2 weeks" },
  { firstName: "Amit", lastName: "Bansal", email: "amit@starlighteducation.in", phone: "+91 96540 77410", companyName: "Starlight Education", industry: "Education", jobTitle: "Principal", source: "Facebook", estimatedValue: 34000, priority: "MEDIUM", requirement: "School website with admissions portal, event gallery and teacher profiles.", timeline: "3 weeks" },
  { firstName: "Farah", lastName: "Khan", email: "farah@noordesignstudio.in", phone: "+91 98180 88325", companyName: "Noor Design Studio", industry: "Interior Design", jobTitle: "Founder", source: "Instagram", estimatedValue: 46000, priority: "MEDIUM", requirement: "Interior design portfolio with project galleries and enquiry sharing.", timeline: "2-3 weeks" },
  { firstName: "Gaurav", lastName: "Chopra", email: "gaurav@eastwesttravels.in", phone: "+91 99110 99643", companyName: "EastWest Travels", industry: "Travel", jobTitle: "Director", source: "Google", estimatedValue: 60000, priority: "HIGH", requirement: "Travel agency website with holiday packages, trip booking and custom itineraries.", timeline: "4 weeks" },
  { firstName: "Swati", lastName: "Reddy", email: "swati@capstonelegal.in", phone: "+91 98490 11074", companyName: "Capstone Legal", industry: "Legal", jobTitle: "Managing Partner", source: "LinkedIn", estimatedValue: 52000, priority: "MEDIUM", requirement: "Law firm website with practice areas, attorney profiles and case consultation.", timeline: "3 weeks" },
  { firstName: "Nikhil", lastName: "Agarwal", email: "nikhil@profinvest.in", phone: "+91 98911 22531", companyName: "Profinvest Advisory", industry: "Finance", jobTitle: "Founder", source: "Google Ads", estimatedValue: 57000, priority: "HIGH", requirement: "Financial advisory SEO site with portfolio service packages and lead forms.", timeline: "3-4 weeks" },
  { firstName: "Meera", lastName: "Desai", email: "meera@harborhotel.in", phone: "+91 98200 33762", companyName: "Harbor Hotel", industry: "Hospitality", jobTitle: "GM", source: "Website Form", estimatedValue: 88000, priority: "HIGH", requirement: "Hotel website with online booking, room gallery and corporate rates.", timeline: "4-5 weeks" },
  { firstName: "Karan", lastName: "Malhotra", email: "karan@victoryautos.in", phone: "+91 98110 44928", companyName: "Victory Auto Spares", industry: "Automotive", jobTitle: "Owner", source: "Cold Call", estimatedValue: 33000, priority: "LOW", requirement: "Auto parts e-commerce catalogue with dealer registration and bulk enquiry.", timeline: "3 weeks" },
  { firstName: "Isha", lastName: "Bhatt", email: "isha@zeronewbeginning.in", phone: "+91 98790 55617", companyName: "ZeroOne Robotics", industry: "Startup", jobTitle: "CEO", source: "LinkedIn", estimatedValue: 110000, priority: "HIGH", requirement: "Startup website with product demo request, investor page and blog.", timeline: "5-6 weeks" },
  { firstName: "Vivek", lastName: "Saxena", email: "vivek@fitnessfirst.in", phone: "+91 98990 66230", companyName: "Fitness First Studio", industry: "Fitness", jobTitle: "Trainer", source: "Instagram", estimatedValue: 21000, priority: "MEDIUM", requirement: "Personal training studio promotion with schedule and enquiry form.", timeline: "1-2 weeks" },
  { firstName: "Sanjana", lastName: "Rao", email: "sanjana@bloomorganics.in", phone: "+91 98450 77941", companyName: "Bloom Organics", industry: "E-commerce", jobTitle: "Founder", source: "Website Form", estimatedValue: 75000, priority: "MEDIUM", requirement: "Organic products e-store with subscription plans and delivery tracking.", timeline: "4 weeks" },
  { firstName: "Rohan", lastName: "Deshmukh", email: "rohan@cityengg.in", phone: "+91 95520 00813", companyName: "City Engineering Works", industry: "Manufacturing", jobTitle: "Director", source: "Google", estimatedValue: 92000, priority: "HIGH", requirement: "Manufacturing company B2B site with capability profiles and RFQ form.", timeline: "5 weeks" },
  { firstName: "Tanya", lastName: "Kapoor", email: "tanya@huezbeauty.in", phone: "+91 98180 11702", companyName: "HueZ Beauty Lounge", industry: "Beauty & Salon", jobTitle: "Owner", source: "Instagram", estimatedValue: 27000, priority: "LOW", requirement: "Salon website with service menu, offers and appointments.", timeline: "2 weeks" },
  { firstName: "Aditya", lastName: "Roy", email: "aditya@playschoolkids.in", phone: "+91 98300 22801", companyName: "LittleMinds Playschool", industry: "Education", jobTitle: "Founder", source: "Facebook", estimatedValue: 18000, priority: "LOW", requirement: "Playschool website with admission info, daily activity gallery and enquiry form.", timeline: "10 days" },
  { firstName: "Kiran", lastName: "Pillai", email: "kiran@swiftpil.in", phone: "+91 98470 33690", companyName: "SwiftPil Logistics", industry: "Logistics", jobTitle: "GM Operations", source: "LinkedIn", estimatedValue: 105000, priority: "HIGH", requirement: "Freight forwarder portal with rate calculator and tracking dashboard.", timeline: "6 weeks" },
  { firstName: "Divya", lastName: "Prasad", email: "divya@naturaseeds.in", phone: "+91 99909 44561", companyName: "Natura Seeds", industry: "Agriculture", jobTitle: "Regional Head", source: "Website Form", estimatedValue: 48000, priority: "MEDIUM", requirement: "Seed distributor website with product catalogue and dealer enquiries.", timeline: "3 weeks" },
  { firstName: "Manoj", lastName: "Yadav", email: "manoj@aventhoenix.in", phone: "+91 99530 55219", companyName: "Avent Phoenix", industry: "Events", jobTitle: "Founder", source: "Referral", estimatedValue: 39000, priority: "MEDIUM", requirement: "Event management website with event galleries and quote requests.", timeline: "2-3 weeks" },
  { firstName: "Shreya", lastName: "Ghosh", email: "shreya@thecraftbox.in", phone: "+91 98300 66328", companyName: "The Craft Box", industry: "E-commerce", jobTitle: "Owner", source: "Instagram", estimatedValue: 56000, priority: "MEDIUM", requirement: "Handmade crafts marketplace store with COD and gifting options.", timeline: "3-4 weeks" },
  { firstName: "Alok", lastName: "Tripathi", email: "alok@northviewrealty.in", phone: "+91 98710 77430", companyName: "Northview Realty", industry: "Real Estate", jobTitle: "BD Head", source: "Google Ads", estimatedValue: 135000, priority: "HIGH", requirement: "Commercial real estate leads platform with project listings and broker access.", timeline: "6 weeks" },
  { firstName: "Rashmi", lastName: "Bose", email: "rashmi@karmika.in", phone: "+91 90070 88541", companyName: "Karmika Training", industry: "Education", jobTitle: "Trainer", source: "LinkedIn", estimatedValue: 22000, priority: "LOW", requirement: "Corporate training website with course calendar and batch registration.", timeline: "2 weeks" },
  { firstName: "Harsh", lastName: "Vora", email: "harsh@silverlinejewels.in", phone: "+91 93230 99605", companyName: "Silverline Jewels", industry: "Jewellery", jobTitle: "Partner", source: "Google", estimatedValue: 68000, priority: "HIGH", requirement: "Jewellery e-commerce with virtual try-on teaser and COD support.", timeline: "4-5 weeks" },
  { firstName: "Pallavi", lastName: "Sathe", email: "pallavi@naturestays.in", phone: "+91 98220 11870", companyName: "NatureStays Homestays", industry: "Travel", jobTitle: "Founder", source: "Instagram", estimatedValue: 42000, priority: "MEDIUM", requirement: "Homestay booking website with property listings and seasonal packages.", timeline: "3 weeks" },
  { firstName: "Lakshman", lastName: "Kumar", email: "lakshman@powergridservices.in", phone: "+91 96120 22140", companyName: "PowerGrid Electricals", industry: "Manufacturing", jobTitle: "Proprietor", source: "Cold Call", estimatedValue: 35000, priority: "LOW", requirement: "Electrical services company website with project portfolio and enquiries.", timeline: "2-3 weeks" },
  { firstName: "Zoya", lastName: "Sheikh", email: "zoya@boutiquenoor.in", phone: "+91 98200 33210", companyName: "Boutique Noor", industry: "Fashion", jobTitle: "Designer", source: "Facebook", estimatedValue: 31000, priority: "MEDIUM", requirement: "Designer boutique online store with bespoke order enquiries.", timeline: "2-3 weeks" },
  { firstName: "Tanmay", lastName: "Bhat", email: "tanmay@friendstech.in", phone: "+91 98860 44901", companyName: "Friends IT Solutions", industry: "IT Services", jobTitle: "Director", source: "Website Form", estimatedValue: 95000, priority: "HIGH", requirement: "IT services company website with service pages and client portal.", timeline: "4-5 weeks" },
  { firstName: "Nandini", lastName: "Raman", email: "nandini@sunrisecafe.in", phone: "+91 98420 55084", companyName: "Sunrise Cafe", industry: "Restaurant", jobTitle: "Owner", source: "Instagram", estimatedValue: 20000, priority: "LOW", requirement: "Café website with menu, location and Click-to-WhatsApp ordering.", timeline: "1-2 weeks" },
  { firstName: "Siddharth", lastName: "Kohli", email: "sid@motivegym.in", phone: "+91 98100 66390", companyName: "Motive Gym", industry: "Fitness", jobTitle: "Owner", source: "Google", estimatedValue: 25000, priority: "MEDIUM", requirement: "Gym website with trainer profiles and membership enquiry capture.", timeline: "2 weeks" },
  { firstName: "Bhavna", lastName: "Shah", email: "bhavna@symphonydental.in", phone: "+91 98250 77451", companyName: "Symphony Dental Care", industry: "Healthcare", jobTitle: "Owner", source: "Referral", estimatedValue: 40000, priority: "HIGH", requirement: "Dental clinic website with treatment pages and appointment booking.", timeline: "2-3 weeks" },
  { firstName: "Uday", lastName: "Menon", email: "uday@akkanthtravels.in", phone: "+91 98470 88512", companyName: "Akkanth Travels", industry: "Travel", jobTitle: "Director", source: "LinkedIn", estimatedValue: 70000, priority: "MEDIUM", requirement: "MICE and corporate travel website with RFP form and itineraries.", timeline: "4 weeks" },
  { firstName: "Ritika", lastName: "Goel", email: "ritika@weddingsutra.in", phone: "+91 98990 99630", companyName: "Wedding Sutra Planner", industry: "Events", jobTitle: "Founder", source: "Instagram", estimatedValue: 58000, priority: "HIGH", requirement: "Wedding planning portfolio with galleries and booking enquiries.", timeline: "3-4 weeks" },
  { firstName: "Vikrant", lastName: "Jadhav", email: "vikrant@amruthealthcare.in", phone: "+91 98670 11049", companyName: "Amrut Healthcare", industry: "Pharma", jobTitle: "Branch Manager", source: "Google Ads", estimatedValue: 62000, priority: "MEDIUM", requirement: "Healthcare distributor B2B site with product catalogue and enquiry forms.", timeline: "3-4 weeks" },
  { firstName: "Manisha", lastName: "Dutta", email: "manisha@steelkraft.co.in", phone: "+91 94330 22410", companyName: "SteelKraft Industries", industry: "Manufacturing", jobTitle: "GM", source: "Website Form", estimatedValue: 88000, priority: "HIGH", requirement: "Steel fabrication company website with portfolio and RFQ automation.", timeline: "5 weeks" },
  { firstName: "Ishaan", lastName: "Sharma", email: "ishaan@peakfitacademy.in", phone: "+91 98210 33520", companyName: "PeakFit Academy", industry: "Fitness", jobTitle: "Director", source: "Instagram", estimatedValue: 26000, priority: "MEDIUM", requirement: "Sports academy website with coaching programs and enrolment form.", timeline: "2 weeks" },
  { firstName: "Geeta", lastName: "Krishnan", email: "geeta@mudracrafts.in", phone: "+91 98400 44892", companyName: "Mudra Crafts", industry: "E-commerce", jobTitle: "Proprietor", source: "WhatsApp", estimatedValue: 33000, priority: "LOW", requirement: "Handicraft export website with catalogue and quotation requests.", timeline: "3 weeks" },
  { firstName: "Afzal", lastName: "Hussain", email: "afzal@deccantours.in", phone: "+91 98490 55213", companyName: "Deccan Tours & Travels", industry: "Travel", jobTitle: "Owner", source: "Facebook", estimatedValue: 44000, priority: "MEDIUM", requirement: "Tour operator website with sightseeing packages and group bookings.", timeline: "3 weeks" },
  { firstName: "Chetan", lastName: "Bharadwaj", email: "chetan@campusplus.in", phone: "+91 98450 66340", companyName: "Campus Plus", industry: "Education", jobTitle: "Director", source: "LinkedIn", estimatedValue: 50000, priority: "MEDIUM", requirement: "Educational consulting website with study abroad program forms.", timeline: "3-4 weeks" },
  { firstName: "Shalini", lastName: "Pandey", email: "shalini@rajwedding.in", phone: "+91 98970 77418", companyName: "Raj Wedding Cards", industry: "Print & Design", jobTitle: "Owner", source: "Google", estimatedValue: 19000, priority: "LOW", requirement: "Wedding invitation printing showroom with online catalogue.", timeline: "10 days" },
  { firstName: "Arnav", lastName: "Rana", email: "arnav@oakwoodhotels.in", phone: "+91 98110 88560", companyName: "Oakwood Hotels", industry: "Hospitality", jobTitle: "GM", source: "Website Form", estimatedValue: 125000, priority: "HIGH", requirement: "Hotel chain website with multi-property booking engine.", timeline: "6 weeks" },
  { firstName: "Sonal", lastName: "Mehta", email: "sonal@finoservices.in", phone: "+91 98240 99671", companyName: "Fino Financial Services", industry: "Finance", jobTitle: "Branch Head", source: "Referral", estimatedValue: 54000, priority: "MEDIUM", requirement: "Financial services website with loan eligibility calculators and lead forms.", timeline: "4 weeks" },
  { firstName: "Tushar", lastName: "Gade", email: "tushar@agrithrive.in", phone: "+91 99600 11067", companyName: "AgriThrive", industry: "Agriculture", jobTitle: "Founder", source: "Google Ads", estimatedValue: 37000, priority: "LOW", requirement: "Agri-input marketplace with supplier profile pages and enquiry.", timeline: "3 weeks" },
  { firstName: "Preeti", lastName: "Sawant", email: "preeti@wavecrestlabs.in", phone: "+91 98200 22314", companyName: "WaveCrest Labs", industry: "Startup", jobTitle: "CTO", source: "LinkedIn", estimatedValue: 108000, priority: "HIGH", requirement: "SaaS startup marketing site with demo booking and product tour.", timeline: "5-6 weeks" },
  { firstName: "Kunal", lastName: "Jain", email: "kunal@crystaltime.in", phone: "+91 98290 33420", companyName: "Crystal Time Jewellers", industry: "Jewellery", jobTitle: "Partner", source: "Instagram", estimatedValue: 65000, priority: "MEDIUM", requirement: "Jewellery showroom with online catalogue and store pickup options.", timeline: "4 weeks" },
  { firstName: "Amrita", lastName: "Kaur", email: "amrita@devonidcalls.in", phone: "+91 98880 44501", companyName: "Devonid Calls", industry: "Beauty & Salon", jobTitle: "Owner", source: "Website Form", estimatedValue: 23000, priority: "LOW", requirement: "Beauty parlour website with offers and appointment booking.", timeline: "2 weeks" },
  { firstName: "Yash", lastName: "Thakur", email: "yash@metroremovals.in", phone: "+91 99670 55612", companyName: "Metro Removals", industry: "Logistics", jobTitle: "Owner", source: "Google", estimatedValue: 29000, priority: "MEDIUM", requirement: "Packers & movers website with instant quote calculator.", timeline: "3 weeks" },
  { firstName: "Sejal", lastName: "Barot", email: "sejal@natvarsweets.in", phone: "+91 98240 66730", companyName: "Natvar Sweets", industry: "Food", jobTitle: "Owner", source: "WhatsApp", estimatedValue: 26000, priority: "MEDIUM", requirement: "Sweet shop website with order-ahead and festive combos.", timeline: "2 weeks" },
];

/** Deterministic date hash → stable batch per day. */
function hashDate(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i++) {
    h = (h << 5) - h + date.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getDailyLeadTemplates(date: string, count = 5): LeadTemplate[] {
  const start = hashDate(date);
  const out: LeadTemplate[] = [];
  for (let i = 0; i < count; i++) {
    const idx = (start + i) % LEAD_POOL.length;
    out.push(LEAD_POOL[idx]);
  }
  return out;
}

export function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** India-style phone formatting used in the daily pool. */
export function formatIndianPhone(phone: string): string {
  return phone;
}