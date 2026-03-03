export const operators = [
  {
    name: '🇩🇪 Patrick Andrae',
    role: 'CEO, HomeToGo',
    tagline: 'The only person in the room who went from the first line of code to the public listing and did it across 30 countries',
    description: [
      'Patrick built HomeToGo from a blank page to a public company with over €350M in revenue, 1,500 employees, and operations across 30+ countries. That full journey matters because he has solved every problem a scaling founder will face, not in theory but in practice and under pressure.',
      'What makes him rare is the combination of depth and range. A self-taught developer with a PhD in Law, he can sit with a technical co-founder at pre-seed and debug product decisions, then help the same founder think through a Series B or new market entry two years later.',
      'Founders call Patrick to navigate their first international expansion, pressure-test a fundraise, or build the hiring infrastructure to scale beyond their home market. He has co-invested alongside OTF in 12 companies including Runware, Xaver, Montamo, and Cala AI.',
    ],
    stats: [
      { value: '$500M', label: 'Raised' },
      { value: '1,500+', label: 'Hires' },
      { value: '12', label: 'Joint deals' },
    ],
    tags: ['0 to IPO, no shortcuts', 'Built the GTM playbook across Europe', "Europe's most complete founder journey"],
  },
  {
    name: '🇬🇧 Felix Leuschner',
    role: 'CEO, Venmark',
    tagline: 'The founder who has been through the acquisition process and knows what it takes to build a company someone actually wants to buy',
    description: [
      'Felix built Drover from zero, raised $30M+ from Cherry and others, and sold it to Cazoo before joining the executive team through its $7B New York listing. He is now building again at Venmark, which means every conversation he has with a portfolio founder is grounded in what is working today.',
      'What Felix brings that most operators cannot is hard-won commercial instinct at the earliest stages. He has been the founder-led salesperson with no team, the person who had to figure out unit economics before there was a finance function.',
      'Founders call Felix when they need to fix their unit economics, build their first sales motion, or figure out what a path to acquisition actually looks like. His 10 co-investments alongside OTF including DeBlock, Capably, Warden, and Firenze reflect genuine conviction.',
    ],
    stats: [
      { value: '$100M', label: 'Raised' },
      { value: '200+', label: 'Hires' },
      { value: '10', label: 'Joint deals' },
    ],
    tags: ['GTM before you can afford it', 'Margin optimisation at scale', 'Multiple exits, still building'],
  },
  {
    name: '🇸🇪 Fredrik Hjelm & Adam Jafer',
    role: 'CEO & CTO, Voi Technology',
    tagline: "The operators who won one of Europe's hardest startup races and now open doors that no VC ever could",
    description: [
      "Fredrik and Adam built Voi into Europe's leading micromobility company, raising $400M+, hiring 1,000+ people across 100+ cities, and reaching profitability in a category where most well-funded competitors failed.",
      "Fredrik is one of the most connected operators in the Nordic ecosystem and beyond — a word from him opens doors that a cold email from a VC never will. Adam, as the technical co-founder who built and scaled Voi's entire engineering infrastructure, gives portfolio companies rare peer-level technical advice.",
      "Founders call Fredrik and Adam when they need an introduction that actually lands, a playbook for scaling across markets, or a CTO-level sounding board on engineering decisions.",
    ],
    stats: [
      { value: '$400M', label: 'Raised' },
      { value: '1,000+', label: 'Hires' },
      { value: '8', label: 'Joint deals' },
    ],
    tags: ['100 cities, one playbook', 'Engineering depth meets ecosystem reach', 'Nordic kingmakers'],
  },
  {
    name: '🇬🇧 🇷🇴 Andrei Danescu, Oana Jinga & Adrian Negoita',
    role: 'CEO, CCO & CTO, Dexory',
    tagline: "The team that built one of Europe's most technically complex businesses from scratch, with backgrounds spanning Formula 1, Google, and IBM",
    description: [
      'Since 2015, Andrei, Oana, and Adrian have scaled Dexory from a garage project into a global leader in warehouse automation and AI, with hundreds of robots deployed in production environments for some of the world\'s largest logistics companies.',
      'For any founder building something technically hard — deep tech, robotics, AI infrastructure, or complex enterprise software — the Dexory team offers something most investors cannot: genuine peer-level credibility.',
      'Founders call the Dexory team when they are building something technically hard and need someone who has actually shipped it at scale.',
    ],
    stats: [
      { value: '$250M', label: 'Raised' },
      { value: '200+', label: 'Hires' },
      { value: '10+', label: 'Yrs together' },
    ],
    tags: ['Full stack: hardware, software, AI, sales', 'The people you call when it is technically hard', 'Building categories from scratch'],
  },
];

export const capabilityMatrix = {
  headers: ['Capability', '🇩🇪 Patrick', '🇬🇧 Felix', '🇸🇪 Fredrik & Adam', '🇬🇧🇷🇴 Dexory'],
  sections: [
    {
      title: 'Track record',
      rows: [
        ['Capital raised', '$500M', '$100M', '$400M', '$250M'],
        ['People hired', '1,500+', '200+', '1,000+', '200+'],
        ['Revenue built', '€350M+', '', '$1B+ run rate', ''],
        ['Joint investments with OTF', '12', '10', '8', '1+'],
      ],
    },
    {
      title: 'Commercial & GTM',
      rows: [
        ['Multi-market GTM', 'Exceptional', 'Strong', 'Strong', 'Strong'],
        ['Unit economics', 'Strong', 'Exceptional', 'Strong', 'Strong'],
        ['Enterprise sales', 'Strong', 'Strong', '', 'Exceptional'],
        ['Serial exits', 'Strong', 'Exceptional', '', ''],
      ],
    },
    {
      title: 'Scaling & operations',
      rows: [
        ['Hiring at scale', 'Exceptional', 'Strong', 'Exceptional', 'Strong'],
        ['Hypergrowth scaling', 'Strong', 'Strong', 'Exceptional', 'Strong'],
        ['Fundraising', 'Exceptional', 'Strong', 'Strong', 'Strong'],
        ['Regulatory navigation', '', '', 'Exceptional', ''],
        ['Public markets & IPO', 'Exceptional', 'Strong', '', ''],
      ],
    },
    {
      title: 'Technical depth',
      rows: [
        ['Technical background', 'Self-taught developer, product depth', 'Modern tech stack, B2B SaaS', 'Scalable software & engineering infra', 'Computer vision, robotics & AI systems'],
        ['Hardware & physical ops', '', '', 'Scooter networks at continental scale', 'Robot manufacturing & deployment'],
      ],
    },
  ],
};
