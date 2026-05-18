export const atombergContext = {
  company: {
    name: "Atomberg Technologies",
    founded: "2012",
    headquarters: "Mumbai, India",
    ceo: "Manoj Meena",
    coFounder: "Sibiraj Pradhan",
    employees: "500+",
    website: "atomberg.com"
  },
  ceo: {
    name: "Manoj Meena",
    background: "IIT Bombay alumnus, Mechanical Engineering",
    vision: "To make energy-efficient appliances accessible to every Indian household",
    achievements: [
      "Built India's most energy-efficient ceiling fan",
      "Pioneered BLDC motor technology in Indian consumer appliances",
      "Scaled Atomberg from garage startup to 500+ employees",
      "Featured in Forbes India 30 Under 30"
    ],
    leadershipStyle: "Engineering-first, data-driven decision making",
    publicProfiles: {
      linkedin: "linkedin.com/in/manojmeena",
      twitter: "@manojmeena"
    }
  },
  products: [
    { name: "Efficio", type: "Ceiling Fan", tech: "BLDC Motor", efficiency: "65% less power than conventional fans" },
    { name: "Renesa", type: "Ceiling Fan", tech: "Smart IoT", features: "Remote control, timer, sleep mode" },
    { name: "Studio", type: "Pedestal Fan", tech: "BLDC Motor", target: "Premium segment" },
    { name: "Gorilla", type: "Ceiling Fan", tech: "BLDC Motor", target: "Mass market" }
  ],
  technology: {
    core: "BLDC (Brushless DC) Motor Technology",
    patents: "25+ patents in motor design and IoT",
    rndFocus: [
      "AI-powered fan speed optimization",
      "Solar integration for off-grid cooling",
      "Voice assistant integration (Alexa, Google Home)",
      "Predictive maintenance algorithms"
    ],
    manufacturing: "Fully automated facility in Mumbai"
  },
  marketPosition: {
    category: "Energy-efficient consumer appliances",
    marketShare: "35% of premium fan segment in India",
    growth: "150% YoY revenue growth",
    presence: "India, UAE, Nepal, Bangladesh",
    expansion: "Entering Southeast Asia and Africa"
  },
  competitors: [
    {
      name: "Orient Electric",
      marketShare: "28%",
      strengths: ["Established distribution", "Wide product range"],
      weaknesses: ["Higher power consumption", "Less IoT integration"],
      recentMoves: "Launched 'Eco' series in 2025, acquired smart home startup"
    },
    {
      name: "Crompton Greaves",
      marketShare: "22%",
      strengths: ["Brand trust", "Rural penetration"],
      weaknesses: ["Slower innovation cycle", "No BLDC focus"],
      recentMoves: "Partnered with Tata Power for energy-efficient campaigns"
    },
    {
      name: "Havells India",
      marketShare: "15%",
      strengths: ["Premium brand positioning", "Strong B2B"],
      weaknesses: ["Limited fan portfolio", "Higher pricing"],
      recentMoves: "Entered smart home ecosystem with 'Havells Sync'"
    }
  ],
  industryTrends: {
    current: [
      "IoT-enabled smart fans growing 40% annually",
      "Government push for energy efficiency (BEE ratings)",
      "Post-pandemic demand for air circulation solutions",
      "Rural electrification driving volume growth"
    ],
    emerging: [
      "AI-driven climate adaptive fans (2026 trend)",
      "Solar-powered cooling for off-grid areas",
      "Voice-controlled appliances in Tier 2/3 cities",
      "Predictive maintenance via edge computing"
    ],
    technologies: [
      { name: "Edge AI for appliance control", maturity: "Emerging", impact: "High" },
      { name: "Gallium Nitride (GaN) semiconductors", maturity: "Early", impact: "High" },
      { name: "Solid-state batteries", maturity: "Research", impact: "Medium" },
      { name: "Matter/Thread protocol for IoT", maturity: "Growing", impact: "Medium" }
    ]
  }
};
