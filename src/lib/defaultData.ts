import type { ResumeData } from '@/types/resume';

export const DEFAULT_RESUME_DATA: ResumeData = {
  personalInfo: {
    name: 'GAD BADR SAAD SANAD',
    title: 'SOFTWARE ENGINEER',
    email: 'gad.elhak23@gmail.com',
    phones: ['+201559660120', '+201157755120'],
    location: 'Mansoura, EGYPT',
    links: [
      { label: 'Upwork', url: 'https://www.upwork.com/freelancers/~0151601b9d233db4b8' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/gad-badr-583060208/' },
      { label: 'GitHub', url: 'https://github.com/DevGadBadr' },
    ],
  },
  about:
    'Professional Developer and Engineer always seeking to excel and advance in the technology field. Combining Electrical Engineering background with strong software development skills to build reliable, automated, and data-driven systems.',
  experience: [
    {
      id: '1',
      role: 'Web Developer',
      roleSubtitle: '+3 Year Freelancer for Automation and Web Projects',
      company: 'Upwork',
      period: '03/2023 – Ongoing',
      bullets: [
        'Built a web-based Automation tool for Clinics patients data matching, PDF reports generation and posting to ClickUp. Mainly used React and Nest frameworks.',
        'Built a web-based automation tool using React / Nest / Playwright to automate managing bulk Amazon account settings.',
        'More than three years of coding experience using Python and JS.',
        'Adhering to programming best practices and clean coding.',
        'Designing, building and coding applications from scratch.',
        'Software engineering and systems design.',
      ],
    },
    {
      id: '2',
      role: 'Electrical Engineer',
      roleSubtitle: '+4 Years of Practical Experience as Engineer',
      company: 'MADKOUR Technology',
      period: '11/2020 – Ongoing',
      bullets: [
        'Developing Automation/SCADA for agricultural/electrical projects.',
        'Teamwork and engaging in successful project completion.',
        'Working with ERP Systems for reports and business management.',
      ],
    },
  ],
  projects: [
    {
      id: '1',
      title: 'Web Based SCADA Platform',
      description: 'Using React and Express APIs with JavaScript / Python / CSS',
      bullets: [
        'Used ReactJs framework to build the front-end with responsive design and modern UI from scratch.',
        'Integrating communication protocols and APIs / Web Sockets to manage real-time data flow.',
        'Backend with Node.js/Express handling device data, alarms, and historical logs.',
      ],
      tags: ['React', 'Node.js', 'WebSockets', 'Python', 'CSS'],
    },
    {
      id: '2',
      title: 'Clinic Automation Tool',
      description: 'React / NestJS / PDF generation / ClickUp API',
      bullets: [
        'Automated patient data matching from multiple sources into structured PDF reports.',
        'Integrated ClickUp API to post and manage tasks directly from the web interface.',
        'Reduced manual clinic data entry time by over 80%.',
      ],
      tags: ['React', 'NestJS', 'Puppeteer', 'ClickUp API'],
    },
    {
      id: '3',
      title: 'Amazon Account Manager',
      description: 'React / Nest / Playwright — bulk account automation',
      bullets: [
        'Automated bulk account settings management for Amazon seller accounts using Playwright.',
        'Built a dashboard to queue, monitor, and log automation jobs in real time.',
      ],
      tags: ['React', 'NestJS', 'Playwright', 'Automation'],
    },
    {
      id: '4',
      title: 'Multiple Python Scripts & Tools',
      description: 'From Games to Automation Scripts',
      bullets: [
        'Mastered Python OOP, functions coding, and proper project structure.',
        'Selenium-based web scrapers and automation bots.',
        'Defined and leveraged useful Python libraries across multiple domains.',
      ],
      tags: ['Python', 'Selenium', 'PyQt', 'Automation'],
    },
  ],
  skills: [
    'Python', 'TypeScript', 'JavaScript', 'React', 'Node.js', 'NestJS',
    'HTML', 'CSS', 'Flask', 'Next.js',
    'Selenium', 'Playwright', 'Make.com',
    'MySQL', 'PostgreSQL', 'MongoDB',
    'Docker', 'DevOps', 'AWS', 'Google Cloud', 'Ubuntu', 'SSH',
    'GIT', 'VSCode',
    'SCADA', 'Ignition', 'Web Sockets', 'APIs',
    'PyQt', 'Inkscape',
    'WinSCP', 'Putty',
    'Engineering', 'Web Development',
  ],
  education: [
    {
      id: '1',
      degree: 'BSc. Degree in Electrical Engineering',
      institution: 'Mansoura University',
      period: 'Sept 2015 – June 2020',
    },
    {
      id: '2',
      degree: 'M.Sc. in Solar Power Systems Optimization with AI',
      institution: 'Mansoura University',
      period: 'Sept 2021 – Ongoing',
    },
  ],
  certificates: [
    {
      id: '1',
      title: 'Python Programming',
      issuer: 'Udemy',
      date: 'May 16, 2023',
    },
    {
      id: '2',
      title: 'Advanced Web Development',
      issuer: 'Udemy',
      date: 'July 18, 2025',
    },
  ],
};
