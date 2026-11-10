// PUT IN: lib/crewcore/handbook-content.js
// lib/crewcore/handbook-content.js: the Employee Handbook, in-app.
//
// Source: Employee_Handbook.docx, uploaded Aug 2026, revised Nov 2026 with
// Ryan (PTO approval rules, closed days list, attendance definitions,
// benefits, harassment, social media, dress code standards, travel,
// discipline steps, PTO payout). Every paragraph the revision did not touch
// is carried over word for word from the Aug 2026 version.
//
// This is TEXT CONTENT, not configuration. Editing the handbook means
// editing this file and redeploying. Changing HANDBOOK_UPDATED asks every
// employee to agree again (api/crewcore/handbook.js compares it to the
// version on their record).
//
// HANDBOOK_CHANGES is what the Handbook screen lists under "What changed"
// and tags as New or Updated. It only shows while its version matches
// HANDBOOK_UPDATED, so the next revision starts clean: bump the version and
// replace the list. Each item names a section id and, optionally, the exact
// sub-heading text it points at. lib/crewcore/handbook-changes.js turns it
// into jump links and tags, and the tests refuse an item that points at a
// section or heading that isn't here.
//
// Structure: an ordered list of sections, each with a stable "id" (used for
// deep links / anchor scrolling in the UI) and a "title", holding one or
// more "blocks". A block is a paragraph ({ p: "..." }), a sub-heading
// ({ h: "..." }), a bulleted list ({ list: [...] }) or a numbered list
// ({ ol: [...] }). Kept deliberately simple: this is rendered, not parsed
// back into policy logic anywhere.
//
// ESM. Do NOT convert to module.exports.

export const HANDBOOK_UPDATED = "2026-11"; // shown in the UI; changing it asks everyone to agree again

export const HANDBOOK_CHANGES = {
  version: "2026-11",
  items: [
    { section: "paid-time-off", heading: "Requesting Time Off", kind: "updated", summary: "48 hours' notice for full and half days, first come first served, taken in 1-hour steps." },
    { section: "paid-time-off", heading: "Busy Season and Holidays", kind: "new", summary: "Time off is limited October through December and around shop holidays." },
    { section: "paid-time-off", heading: "Denied Requests", kind: "new", summary: "Taking denied time off anyway counts as an unexcused absence." },
    { section: "paid-time-off", heading: "Illness and Emergencies", kind: "new", summary: "No 48 hours needed. Call in 30 minutes before your shift." },
    { section: "paid-time-off", heading: "When PTO Runs Out", kind: "new", summary: "How unpaid time off works." },
    { section: "paid-time-off", heading: "Eligibility and Amount", kind: "updated", summary: "Who gets PTO and holiday pay, and when new hires can use it." },
    { section: "paid-time-off", heading: "Paid Holidays", kind: "updated", summary: "The actual list of days we're closed." },
    { section: "paid-time-off", heading: "Bereavement Leave", kind: "updated", summary: "Who counts for 5, 2 and 1 days, used within 30 days." },
    { section: "attendance", heading: "Excused and Unexcused Absences", kind: "new", summary: "What counts as excused, and when a doctor's note is needed." },
    { section: "attendance", heading: "Tardiness", kind: "new", summary: "More than 5 minutes late is a tardy. Three tardies are one occurrence." },
    { section: "work-hours-and-pay", heading: "Nursing Breaks", kind: "new", summary: "Break time and a private space to pump." },
    { section: "benefits", kind: "new", summary: "SIMPLE IRA, health insurance, apparel stipend and time off in one place." },
    { section: "workplace-policies", heading: "Harassment and Complaints", kind: "new", summary: "How to report a problem, and no retaliation." },
    { section: "workplace-policies", heading: "Social Media Policy", kind: "new", summary: "Posting our work, official accounts, your own accounts." },
    { section: "workplace-policies", heading: "Travel and Expense Reimbursement", kind: "new", summary: "Mileage, hotels and meals on approved trips." },
    { section: "dress-code", heading: "Standards", kind: "new", summary: "What to wear in the front office, in production and at events." },
    { section: "prohibited-behaviors", heading: "Inappropriate Use of Social Media", kind: "updated", summary: "Now about confidential company and client information." },
    { section: "progressive-discipline", heading: "Steps", kind: "new", summary: "Verbal, written, final written warning, termination." },
    { section: "separation-of-employment", heading: "PTO Payout", kind: "updated", summary: "Paid on PTO earned this year, only with two weeks' notice." },
  ],
};

export const HANDBOOK_SECTIONS = [
  {
    id: "about-us",
    title: "About Us",
    blocks: [
      { p: "P&M Apparel is a woman-owned, third-generation family business specializing in custom apparel and promo products, located in Polk City, Iowa. Our roots are literally Mom and Pop Shop; we started in the basement of Phyllis and Melvin (the P&M) as a new career after farming and remodeling homes most of their lives. Their daughter Kay took over the business a few years after it moved to Polk City and two of her children, Megan and Ryan, joined the ranks as business grew. Ryan and Megan took over ownership in 2023." },
      { p: "Since 1987 we have been providing unparalleled service to small businesses, groups, organizations and teams throughout Central Iowa. And even though our area of operation has expanded to the entire United States as well as other countries, we haven't forgotten what has brought us to this point, our commitment to customer service second to none." },
      { p: "This site is intended to be an internal resource for new and existing employees. It covers the basics from company hierarchy to onboarding documents and job descriptions. This is a living site and will be updated as necessary." }
    ]
  },
  {
    id: "our-purpose",
    title: "Our Purpose",
    blocks: [
      { p: "Every client that comes to us is looking to communicate an idea, a brand, an event, an ideology, and they need a device to communicate with. That's often apparel, but can also be logo design, promotional products, marketing materials, any number of things." },
      { p: "Our purpose is to listen to the client and create solutions that are specific to that client. We know what we are and we know what we're not. We are not custom ink, we are not our competitors, we are not interested in selling the cheapest shirt we can, we are not a copy and paste experience where a client gets the exact same products, art, etc. as their competitor. We ARE listeners who develop products unique to each client. Our clients come to us trusting that we care about what they are trying to communicate as much as they do. We are quality experts that are passionate about what we do and the clients coming to us are looking for high quality, highly personalized, custom experiences." }
    ]
  },
  {
    id: "our-niche",
    title: "Our Niche",
    blocks: [
      { p: "We often say sometimes a shirt is more than a shirt. Every day, we're talking to clients who may be coming in for a shirt, but really, the shirt represents a fundraiser for a loved one with an illness. Or maybe it's someone that took a leap and is investing their savings into a small business. Or the shirt represents the child they would die for playing the sport that gives them life." },
      { p: "The stories behind the shirt are what we are creating, the shirt is just the conduit for the story. Likewise, we are not just delivering a shirt, we are representing the dreams that are so wildly beyond what Phyllis and Melvin had in their basement so many years ago." },
      { p: "So we don't take ourselves too seriously, we know we print shirts and are not brain surgeons, that a t-shirt won't \u201cruin Christmas.\u201d But we also know what came before us and that our clients are trusting us with their story." }
    ]
  },
  {
    id: "employment-basics",
    title: "Employment Basics",
    blocks: [
      { h: "Introductory Period" },
      { p: "All new employees will serve a 90-day introductory period. During this time, performance, attendance, and overall fit with the company will be evaluated. Successful completion of the introductory period does not guarantee continued employment, as employment remains at will." },
      { h: "Employee Classification" },
      { p: "Employees are classified as full-time, part-time, seasonal, or temporary. Full-time employees are regularly scheduled to work at least 30 hours per week. Part-time employees are regularly scheduled to work less than 30 hours per week. Seasonal and temporary employees are hired for a set project or limited time period." },
      { h: "Work Eligibility" },
      { p: "In compliance with federal law, all employees must complete the Form I-9 and provide valid documentation to verify their eligibility to work in the United States." }
    ]
  },
  {
    id: "work-hours-and-pay",
    title: "Work Hours and Pay",
    blocks: [
      { h: "Workweek and Standard Hours" },
      { list: [
        "Front office: Monday through Friday, 8:00 a.m. to 5:00 p.m.",
        "Production: Monday through Friday, 8:00 a.m. to 4:30 p.m."
      ] },
      { h: "Pay Periods" },
      { p: "Employees are paid twice per month, on the 1st and the 16th. If payday falls on a weekend or holiday, pay will be issued on the last business day prior." },
      { h: "Timekeeping" },
      { p: "Hourly employees must clock in upon arrival, clock out for lunch, clock back in after lunch, and clock out at the end of their shift. Employees are also required to clock out if they leave the premises for any reason other than a 15-minute break." },
      { h: "Breaks and Meal Periods" },
      { p: "Hourly employees are provided two paid 15-minute breaks per shift. These breaks may not be combined or used to leave early. Lunch periods are unpaid and generally last 30 minutes. Salary employees get an hour lunch." },
      { h: "Nursing Breaks" },
      { p: "Employees who are nursing get reasonable break time to pump for as long as they need it. A private office with a lock is available for this, never a bathroom. Use your regular paid breaks first. Extra time is unpaid for hourly staff. Talk to your supervisor or an owner to set it up." },
      { h: "Overtime" },
      { p: "Overtime for hourly employees is paid at one and one-half times the regular hourly rate for hours worked over 40 in a workweek. All overtime must be approved in advance by the employee's direct supervisor." }
    ]
  },
  {
    id: "attendance",
    title: "Attendance",
    blocks: [
      { h: "Purpose" },
      { p: "The purpose of this policy is to set forth P&M Apparel's policy and procedures for handling employee absences and tardiness to promote the efficient operation of the company and minimize unscheduled absences." },
      { h: "Policy" },
      { p: "Punctual and regular attendance is an essential responsibility of each employee at P&M Apparel. Employees are expected to report to work as scheduled, on time and prepared to start working. Employees also are expected to remain at work for their entire work schedule. Late arrival, early departure or other absences from scheduled hours are disruptive and must be avoided. This policy does not apply to leave provided as a reasonable accommodation under the Americans with Disabilities Act (ADA)." },
      { h: "Absence" },
      { p: "\u201cAbsence\u201d is defined as the failure of an employee to report for work when they are scheduled to work." },
      { h: "Excused and Unexcused Absences" },
      { p: "An absence is excused if it is:" },
      { list: [
        "Approved PTO, or approved unpaid time off",
        "Illness or an emergency, called in to your direct supervisor and one director at least 30 minutes before your shift (paid from PTO if you have it, unpaid if you don't)",
        "Jury duty, military leave, bereavement, or leave given as an accommodation",
        "A day the shop is closed, including weather closings"
      ] },
      { p: "Anything else is unexcused, including denied time off taken anyway and illness that wasn't called in on time." },
      { p: "If you're out sick 3 or more days in a row, bring a doctor's note when you return." },
      { h: "Tardiness" },
      { p: "Clocking in more than 5 minutes after your scheduled start is a tardy. Three tardies count as one unexcused occurrence." },
      { h: "Disciplinary Action" },
      { p: "Excessive absenteeism is defined as three or more occurrences of unexcused absence in a 30-day period and will result in disciplinary action. 12 occurrences of unexcused absence in a 12-month period are considered grounds for termination." },
      { h: "Job Abandonment" },
      { p: "Any employee who fails to report to work for a period of two days or more without notifying their supervisor will be considered to have abandoned the job and voluntarily terminated the employment relationship." },
      { h: "Inclement Weather" },
      { p: "P&M Apparel will be following the operating status of the federal government during inclement weather. Prior to normal starting time it will be announced if P&M Apparel will be closed. All full-time employees will be paid for such time off. Part-time employees will be paid if normally scheduled to work that day and only for those hours which the employee would normally work. If no announcement is made, P&M Apparel will be open and all employees will be expected to make reasonable efforts to get to work. Employees unable to arrive for work due to inclement weather will be charged one (1) day of PTO. If no PTO is available, nonexempt employees will not be paid for the day. All employees who are unable to report to work should call their direct supervisor, and one director, and report their absence 30 minutes prior to the start of their work day." },
      { p: "On days when weather conditions worsen as the day progresses, P&M Apparel may decide to close the office early. Employees will be expected to remain at work until the appointed closing time. Employees may choose to leave earlier than the appointed closing time at their discretion. If employees choose to leave early, their direct supervisor may charge up to one-half (1/2) day of PTO." }
    ]
  },
  {
    id: "paid-time-off",
    title: "Paid Time Off",
    blocks: [
      { h: "Eligibility and Amount" },
      { p: "Full-time employees receive PTO and holiday pay. Part-time, seasonal, and temporary employees do not." },
      { p: "New hires receive 10 days of PTO, prorated by the days left in the year from your start date. For example, someone starting July 1 gets about 5 days. PTO can be used once the 90-day introductory period is complete." },
      { p: "Starting the first January 1 after you complete a full year of employment, you receive 15 days each year. PTO does not roll over and resets every January 1." },
      { h: "Requesting Time Off" },
      { p: "Request time off in CrewCore, under Time Off. Your balance for the year is shown there, and you will get a notification when your request is approved or denied. Requests are approved first come, first served." },
      { p: "PTO is taken in increments of at least 1 hour. Pick the type that fits: all day, half day, arrive late, leave early, or appointment." },
      { p: "Full and half days need at least 48 hours' notice. Arriving late, leaving early, and appointments can be requested the same day with your supervisor's OK." },
      { h: "Busy Season and Holidays" },
      { p: "October through December is our busiest time of year, and the days around shop holidays are the ones everyone wants. Time off during these periods is limited. A request may be denied if too many people are already out or production needs the coverage. Get these requests in early." },
      { h: "Denied Requests" },
      { p: "If your request is denied and you take the time anyway, it counts as an unexcused absence under the Attendance policy." },
      { h: "Illness and Emergencies" },
      { p: "Illness and emergencies don't need 48 hours' notice. Call your direct supervisor and one director at least 30 minutes before your shift, and PTO will be used." },
      { p: "The notice and approval rules above do not apply to jury duty, military leave, bereavement, or leave given as an accommodation." },
      { h: "When PTO Runs Out" },
      { p: "Once your PTO is used up, you can request unpaid time off in CrewCore the same way. Approval is up to management. Approved unpaid time is excused, and unapproved time is unexcused. If you're sick, have no PTO left, and call in on time, the absence is excused and unpaid." },
      { h: "Live Events Payment and Paid Time Off Accrual" },
      { p: "P&M Apparel has several events a year we Live Print or Decorate. People who volunteer to work these events are compensated in the following manner:" },
      { list: [
        "Hourly Staff are paid time and a half their normal rate for the event duration",
        "Salary Staff earn 1 hour of PTO per hour of the event"
      ] },
      { h: "Paid Holidays" },
      { p: "P&M Apparel is closed, and eligible employees receive holiday pay, on these days:" },
      { list: [
        "New Year's Day",
        "Memorial Day",
        "Independence Day",
        "Labor Day",
        "Columbus Day",
        "Veterans Day",
        "Thanksgiving",
        "The day after Thanksgiving",
        "Christmas"
      ] },
      { p: "We close at noon on Christmas Eve and New Year's Eve. When a holiday falls on a weekend, we close the Friday before or the Monday after. Closed days show on the Time Off calendar in CrewCore and never come out of your PTO." },
      { h: "Bereavement Leave" },
      { list: [
        "5 paid days: death of a spouse or partner, child, parent, or sibling, including step and foster relationships",
        "2 paid days: death of any other relative, including grandparents, grandchildren, in-laws, aunts, uncles, cousins, nieces, and nephews",
        "1 paid day: death of someone outside your family"
      ] },
      { p: "Bereavement days must be used within 30 days of the death. Additional unpaid leave may be granted at the discretion of management." },
      { h: "Jury Duty" },
      { p: "Employees summoned for jury duty will be granted time off to fulfill their civic obligation. Employees may use PTO during this period or take the leave unpaid. Employees must provide a copy of the jury summons to their supervisor." },
      { h: "Military Leave" },
      { p: "P&M Apparel complies with the Uniformed Services Employment and Reemployment Rights Act (USERRA). Employees who are called to military service will be granted leave in accordance with federal law and reinstated to their position upon return, as required." },
      { h: "Parental Leave" },
      { p: "Employees may use PTO for parental leave related to the birth or adoption of a child. Additional unpaid leave may be granted in compliance with applicable state or federal law." }
    ]
  },
  {
    id: "benefits",
    title: "Benefits",
    blocks: [
      { h: "SIMPLE IRA" },
      { p: "P&M Apparel matches your contributions up to 3% of your pay. You can enroll after 90 days. Get the packet and choose Enroll or Decline on your CrewCore Dashboard." },
      { h: "Health Insurance" },
      { p: "Full-time employees are eligible for our group health plan. Coverage starts the first of the month after your 60th day." },
      { h: "Apparel Stipend" },
      { p: "Front Office staff receive $250 per year and Production staff receive $150 per year toward P&M Apparel branded items, for use by the employee and not family, friends, etc. See the Stipend tab in CrewCore for your balance and spend history." },
      { h: "Time Off at a Glance" },
      { list: [
        "PTO: 10 days your first year (prorated), 15 days after that",
        "Holidays: 9 paid holidays plus two half days",
        "Bereavement: up to 5 paid days"
      ] },
      { p: "Full details are under Paid Time Off." }
    ]
  },
  {
    id: "workplace-policies",
    title: "Workplace Policies",
    blocks: [
      { h: "Harassment and Complaints" },
      { p: "P&M Apparel does not tolerate harassment or discrimination of any kind. This includes unwelcome comments, jokes, images, touching, or other conduct based on any characteristic listed in our Equal Opportunity statement, plus sexual harassment of any kind. It applies to employees, customers, vendors, and anyone else you deal with for work, here or at an event." },
      { p: "How to report: tell any supervisor or owner, verbally or in writing. You don't have to go through your own supervisor, and you don't have to go to the person the complaint is about. If the complaint is about Ryan, report it to Megan. If it's about Megan, report it to Ryan. Whoever receives the report will write it down and make sure it is looked into promptly." },
      { p: "What happens next: reports are kept as private as we can while still looking into them. Anyone found to have harassed someone will face discipline, up to and including termination. If a customer or vendor is the problem, management will step in, up to and including ending the business relationship." },
      { p: "No retaliation: no one will be punished for making a complaint in good faith or helping with an investigation. Retaliation is its own violation of this policy." },
      { h: "Technology and Communication" },
      { p: "Company-provided technology, including computers, internet access, and email, is intended for business use. Personal use should be limited and must not interfere with work responsibilities. Employees should use good judgment when accessing the internet or sending email. Inappropriate, illegal, or offensive content is prohibited." },
      { h: "Personal Phones and Headphones" },
      { p: "Personal phone use should be limited to breaks or urgent matters. Employees should avoid extended personal calls during work hours. Headphones are permitted but must be worn in one ear only so employees remain able to communicate with coworkers." },
      { h: "Social Media Policy" },
      { p: "Posting our work: you're welcome to share work you've done here once the customer has the order. Don't post jobs before they're delivered, and never post anything a customer has asked to keep private. Never post vendor pricing, customer contact info, or anything else covered by Confidentiality." },
      { p: "Official accounts: only Ryan and staff he approves post on P&M Apparel's accounts or speak for the company online." },
      { p: "Your own accounts: you're free to list P&M Apparel as your employer. Your opinions are your own, so make that clear if you're talking about the industry or the company." },
      { p: "On the clock: keep personal social media to breaks." },
      { p: "Nothing in this policy limits your right to talk with coworkers or others about wages, hours, or working conditions." },
      { h: "Conflict of Interest and Outside Work" },
      { p: "Employees should avoid outside work that competes with P&M Apparel or conflicts with their responsibilities here. Outside employment within the decorated apparel industry is discouraged. Employees are expected to disclose any outside business activities that may pose a conflict of interest." },
      { h: "Confidentiality" },
      { p: "Customer data, vendor pricing, and internal processes are considered confidential and must not be shared outside of P&M Apparel. Misuse of company information or disclosure of confidential materials may result in disciplinary action up to and including termination." },
      { h: "Travel and Expense Reimbursement" },
      { p: "P&M Apparel reimburses approved work travel:" },
      { list: [
        "Mileage in your personal vehicle, at the current IRS standard rate. Mileage starts at the shop. Your commute isn't covered.",
        "Hotels and travel for approved trips",
        "Meals on overnight trips"
      ] },
      { p: "Get your supervisor's or an owner's approval before the trip. Log mileage and expenses in TravelTrack, with receipts, within 30 days." }
    ]
  },
  {
    id: "dress-code",
    title: "Dress Code",
    blocks: [
      { h: "Purpose" },
      { p: "The P&M Apparel dress code policy is designed to help us all provide a consistent professional appearance to our customers and colleagues. Our appearance reflects on ourselves and the company. The goal is to be sure that we maintain a positive appearance and not to offend customers, clients, or colleagues." },
      { h: "Standards" },
      { list: [
        "Front office: P&M Apparel branded items or business casual. Jeans are fine.",
        "Production: casual clothes that can handle ink, and closed-toed shoes. Avoid anything loose that could catch in equipment.",
        "Events and live printing: wear a P&M Apparel shirt unless the client asks for different attire.",
        "Never: competitor logos, or offensive graphics or text. In the front office, nothing ripped or stained."
      ] },
      { p: "Your apparel stipend covers branded items (see Benefits)." },
      { h: "Dress Code Violations" },
      { p: "Managers or supervisors are expected to inform employees when they are violating the dress code. Employees in violation are expected to immediately correct the issue. This may include having to leave work to change clothes." },
      { p: "Repeated violations or violations that have major repercussions may result in disciplinary action being taken up to and including termination." }
    ]
  },
  {
    id: "health-and-safety",
    title: "Health and Safety",
    blocks: [
      { h: "General Safety" },
      { p: "Employees are expected to follow all safety guidelines, including safe operation of presses, embroidery equipment, chemicals, and tools. Closed-toed shoes are required in production areas. Employees must use protective equipment when provided." },
      { h: "Accident Reporting" },
      { p: "Any workplace accident, injury, or unsafe condition must be reported immediately to a supervisor or director." }
    ]
  },
  {
    id: "performance-and-development",
    title: "Performance and Development",
    blocks: [
      { h: "Performance Reviews" },
      { p: "Performance reviews are conducted annually during our two on one meetings (two leaders, one employee). Reviews are intended to provide feedback, set goals, and identify opportunities for growth. Additional reviews may be held at the discretion of supervisors." },
      { h: "Training and Development" },
      { p: "P&M Apparel provides training to help employees succeed in their roles, including system training (such as Chipply or Printavo), equipment training, and workflow best practices. Employees are encouraged to seek additional development opportunities and bring ideas for improvement to management." },
      { h: "Promotions and Transfers" },
      { p: "Promotions and transfers are based on performance, skills, and business needs. Open positions may be posted internally, and employees are encouraged to apply if interested." }
    ]
  },
  {
    id: "prohibited-behaviors",
    title: "Prohibited Behaviors in the Workplace",
    blocks: [
      { p: "To ensure a safe, productive, and respectful environment for all employees and visitors, the following behaviors are strictly prohibited within the workplace premises. Violation of any of these policies may result in disciplinary action, up to and including termination of employment." },
      { h: "Use of Illegal Substances" },
      { p: "Possession, use, distribution, or sale of illegal drugs or controlled substances on company property is prohibited. Reporting to work under the influence of illegal drugs or alcohol is not permitted. Smoking, vaping, or using tobacco products in the P&M Apparel building is strictly prohibited." },
      { h: "Weapons" },
      { p: "Possession of weapons of any kind on company property, unless expressly permitted by law and authorized by management, is forbidden." },
      { h: "Theft and Vandalism" },
      { p: "Theft, deliberate destruction, defacement, or misuse of company or employee property is strictly prohibited." },
      { h: "Breach of Confidentiality" },
      { p: "Unauthorized use or disclosure of proprietary information or confidential business matters, including personal information of employees and clients, is against company policy." },
      { h: "Misuse of Company Resources" },
      { p: "Company resources, including internet access, email systems, and other electronic resources, are provided for job-related purposes. Misuse or unauthorized personal use of these resources is not allowed. Printing, copying, or downloading unauthorized material on company equipment is prohibited." },
      { h: "Failure to Comply with Safety Guidelines" },
      { p: "Ignoring safety protocols, tampering with safety devices, or engaging in reckless behavior that poses a risk to self or others is unacceptable. Failure to report accidents, injuries, or unsafe conditions may result in disciplinary actions." },
      { h: "Inappropriate Use of Social Media" },
      { p: "Posting confidential company or client information on social media platforms is prohibited. Use of social media should not interfere with work commitments and must comply with our Social Media Policy." },
      { p: "This list is not exhaustive, and employees are expected to exercise common sense and good judgment in their behavior within the workplace." }
    ]
  },
  {
    id: "progressive-discipline",
    title: "Progressive Discipline Policy",
    blocks: [
      { h: "Purpose" },
      { p: "P&M Apparel's progressive discipline policy and procedures are designed to provide a structured corrective action process to improve and prevent a recurrence of undesirable employee behavior and performance issues." },
      { p: "Outlined below are the steps of P&M Apparel's progressive discipline policy and procedures. P&M Apparel reserves the right to combine or skip steps depending on the facts of each situation and the nature of the offense. Some of the factors that will be considered are whether the offense is repeated despite coaching, counseling or training; the employee's work record; and the impact the conduct and performance issues have on the organization. Nothing in this policy provides any contractual rights regarding employee discipline or counseling, nor should anything in this policy be read or construed as modifying or altering the employment-at-will relationship between P&M Apparel and its employees." },
      { h: "Steps" },
      { ol: [
        "Verbal warning. Your supervisor talks with you about the problem and what needs to change. A note goes in your file.",
        "Written warning. A written record of the problem, what's expected, and a timeline to fix it. You'll be asked to sign it.",
        "Final written warning. Issued by Ryan or Megan. It makes clear that the next violation may end your employment.",
        "Termination. Decided by Ryan or Megan."
      ] },
      { p: "Supervisors may issue verbal and written warnings. Final warnings and terminations come from ownership. A warning drops off after 12 months with no further issues, and the next problem starts again at step 1." },
      { h: "Appeals Process" },
      { p: "Employees will have the opportunity to present information to dispute information management has used to issue disciplinary action. The purpose of this process is to provide insight into extenuating circumstances that may have contributed to the employee's performance or conduct issues while allowing for an equitable solution." },
      { p: "If the employee does not present this information during any of the step meetings, they will have five business days after each of those meetings to present such information." },
      { h: "Performance and Conduct Issues Not Subject to Progressive Discipline" },
      { p: "Behavior that is illegal is not subject to progressive discipline and may result in immediate termination. Such behavior may be reported to local law enforcement authorities." },
      { p: "Similarly, theft, substance abuse, intoxication, fighting and other acts of violence at work are also not subject to progressive discipline and may be grounds for immediate termination." },
      { h: "Documentation" },
      { p: "The employee will be provided copies of all progressive discipline documentation. The employee will be asked to sign copies of this documentation attesting to their receipt and understanding of the corrective action outlined in these documents. Copies of these documents will be placed in the employee's official personnel file." }
    ]
  },
  {
    id: "separation-of-employment",
    title: "Separation of Employment",
    blocks: [
      { h: "Termination" },
      { p: "P&M Apparel operates under the principle of at-will employment. This means that neither the employee nor P&M Apparel has entered into a contract regarding the duration of employment. The employee is free to terminate employment with P&M Apparel at any time, with or without reason. Likewise, P&M Apparel has the right to terminate the employee's employment with or without reason. P&M Apparel hopes that employees will provide at least a two (2) week notice in the event of resignation." },
      { h: "PTO Payout" },
      { p: "If you resign with at least two weeks' notice, you'll be paid for the PTO you've earned this year but not used, up to 40 hours. You earn 1/12 of your yearly PTO for each full month worked. For example, someone with 15 days who leaves at the end of March has earned about 3.75 days; if they've used 1 day, they're paid for 2.75. Payout is calculated at your current hourly wage or salary equivalent and included in your final paycheck, issued on the next regular payday following your last day." },
      { p: "If you leave without two weeks' notice, or are terminated, unused PTO is not paid out. If you've used more PTO than you've earned, nothing is taken back." },
      { h: "Insurance Conversion Privileges" },
      { p: "According to the federal Consolidated Omnibus Budget Reconciliation Act (COBRA) of 1985, in the event of termination of employment with P&M Apparel or loss of eligibility to remain covered under our group health insurance program, employees and their eligible dependents may have the right to continued coverage under our group health insurance program for a limited period of time at their own expense. Upon resignation or termination, all company sponsored insurance coverage ends on the date of separation." },
      { h: "Return of Company Property" },
      { p: "Any P&M Apparel owned property issued to an employee, such as product samples, computer equipment, keys, equipment or company credit card must be returned to P&M Apparel at the time of resignation / termination. Employees will be responsible for any lost or damaged items. The value of any property issued and not returned may be deducted from the employee's final paycheck, and the employee may be required to sign a payroll deduction authorization form for this purpose." },
      { h: "Re-Hire Eligibility" },
      { p: "Employees who have resigned or terminated may be eligible for re-hire. Re-hires must re-apply and follow the standard recruitment process. Consideration will be made dependent upon reason for leaving the company and company needs." }
    ]
  },
  {
    id: "employment-disclaimers",
    title: "Employment Disclaimers",
    blocks: [
      { p: "We are an equal opportunity employer and all qualified applicants will receive consideration for employment without regard to race, color, religion, sex, sexual orientation, gender identity or expression, pregnancy, age, national origin, disability status, genetic information, protected veteran status, or any other characteristic protected by law." },
      { p: "Employment with P&M Apparel is at will. This means employment is for an indefinite period of time and it is subject to termination by an employee or P&M Apparel, with or without cause, with or without notice, and at any time." },
      { p: "The at-will employment status of an employee of P&M Apparel may be modified only in a written employment agreement with that employee which is signed by the ownership of P&M Apparel." }
    ]
  }
];
