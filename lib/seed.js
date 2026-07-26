// ─────────────────────────────────────────────────────────────────────────────
// Seed content for the Campus Handbook.
//
// The model:
//   • DEFAULT_SECTIONS  — the one aligned handbook shared by every campus.
//     Anything that differs by location is written as a {{placeholder}}.
//   • FIELD_DEFS         — the list of per-location fields (address, contacts,
//     times, state law, assembly areas...) that fill those placeholders.
//   • LOCATIONS          — each campus edition: a code (e.g. "nyc-2026"), a name,
//     the field VALUES for that campus, and optional per-section overrides
//     for the rare case where a whole section differs.
//
// Resolving a code = DEFAULT_SECTIONS, with that location's fields interpolated
// and any overrides applied. See lib/resolve.js.
// ─────────────────────────────────────────────────────────────────────────────

export const SECTION_GROUPS = [
  'About Alpha',
  'Daily Schedule & Procedures',
  'Policies',
  'Additional Resources',
];

// Per-location fields. `group` is only used to lay out the admin form nicely.
// `multiline` renders a textarea; values may contain Markdown.
export const FIELD_DEFS = [
  // Campus identity
  { key: 'campus_name', label: 'Campus name', group: 'Campus identity', example: 'Alpha - Lower Manhattan' },
  { key: 'city', label: 'City / region name', group: 'Campus identity', example: 'New York' },
  { key: 'address', label: 'Street address', group: 'Campus identity', multiline: true, example: '180 Maiden Lane, New York, New York 10038' },
  { key: 'grades_served', label: 'Grades served', group: 'Campus identity', example: 'grades K–8' },
  { key: 'state', label: 'State (for legal references)', group: 'Campus identity', example: 'New York' },
  { key: 'levels_list', label: 'Levels offered (Markdown list)', group: 'Campus identity', multiline: true, example: '- Learning Lab (K–1)\n- Level 1 (2–3)\n- Level 2 (4–5)\n- Middle School (6–8)' },

  // Daily schedule & logistics
  { key: 'school_start_time', label: 'School day start time', group: 'Daily schedule & logistics', example: '8:30 a.m.' },
  { key: 'dropoff_window', label: 'Drop-off window', group: 'Daily schedule & logistics', example: '8:20–8:30 a.m.' },
  { key: 'dropoff_start_time', label: 'Earliest drop-off / staff on duty', group: 'Daily schedule & logistics', example: '8:20 a.m.' },
  { key: 'tardy_time', label: 'Tardy after', group: 'Daily schedule & logistics', example: '8:45 a.m.' },
  { key: 'dismissal_time', label: 'Dismissal time', group: 'Daily schedule & logistics', example: '3:30 p.m.' },
  { key: 'arrival_request_time', label: 'Requested pickup arrival time', group: 'Daily schedule & logistics', example: '3:25 p.m.' },
  { key: 'entrance_desc', label: 'Main entrance description', group: 'Daily schedule & logistics', multiline: true, example: 'the Maiden Lane side entrance on the corner of Front Street and Maiden Lane' },
  { key: 'dropoff_zone_desc', label: 'Drop-off zone description', group: 'Daily schedule & logistics', multiline: true, example: 'the designated drop-off zones on the west and north sides of the building' },
  { key: 'unattended_release_age', label: 'Age for unattended release', group: 'Daily schedule & logistics', example: 'twelve years of age' },

  // Safety & emergency
  { key: 'security_presence', label: 'On-campus security presence', group: 'Safety & emergency', example: 'at least two security guards' },
  { key: 'primary_assembly', label: 'Primary evacuation assembly area', group: 'Safety & emergency', multiline: true, example: 'the South Street Seaport on Fulton Street (between Front Street and South Street)' },
  { key: 'secondary_assembly', label: 'Secondary evacuation assembly area', group: 'Safety & emergency', multiline: true, example: 'Louise Nevelson Plaza on William Street (between Maiden Lane and Liberty Street)' },
  { key: 'emergency_mgmt_agency', label: 'Local emergency management agency', group: 'Safety & emergency', example: 'NYC OEM' },
  { key: 'booster_seat_age', label: 'Booster seat required under age', group: 'Safety & emergency', example: '8' },

  // Key contacts
  { key: 'head_of_school_name', label: 'Head of School — name', group: 'Key contacts', example: 'Dr. Tasha Arnold' },
  { key: 'head_of_school_phone', label: 'Head of School — phone', group: 'Key contacts', example: '(224) 550-3103' },
  { key: 'lead_guide_name', label: 'Lead Guide — name', group: 'Key contacts', example: 'Liam Stanton' },
  { key: 'lead_guide_phone', label: 'Lead Guide — phone', group: 'Key contacts', example: '(530) 400-0730' },
  { key: 'campus_coordinator_name', label: 'Campus Coordinator — name', group: 'Key contacts', example: 'Julianne Braime' },
  { key: 'campus_coordinator_phone', label: 'Campus Coordinator — phone', group: 'Key contacts', example: '(646) 363-6678' },
];

export const DEFAULT_SECTIONS = [
  // ── About Alpha ────────────────────────────────────────────────────────────
  {
    key: 'about-alpha',
    group: 'About Alpha',
    title: 'About Alpha',
    body: `Alpha was founded in 2016 in Austin, Texas as a private school that now serves students from pre-kindergarten through high school graduation. The Alpha {{city}} campus currently serves students in {{grades_served}}.

**{{campus_name}}**
{{address}}

This handbook is intended to be a living document. The date on the cover page reflects the most recent date of changes.`,
  },
  {
    key: 'educational-philosophy',
    group: 'About Alpha',
    title: 'Educational Philosophy',
    body: `Alpha was founded on three commitments that form the basis of our educational philosophy:

### Students love school.
Students love school when they see how their day-to-day work is aligned with their interests and passions. At Alpha, students feel a sense of ownership of the community and are encouraged and supported by guides they trust. Students at Alpha persevere through challenges and failures because they understand it is the positive cycle on the path to success. As they develop competence, they develop confidence and a desire to learn and develop their talents and passions.

### Students learn two times (2x) more in only 2 hours per day.
Alpha students learn twice as much as standard school students while only spending 2 hours per day on academics. We accomplish this by replacing the standard teacher-in-front-of-a-classroom model with personalized, mastery-based learning. Learning science, technology and AI enable this accelerated learning. In our Learn2Learn workshops students are taught to become self-driven learners. By only having to spend mornings on academics, Alpha frees up afternoons for challenging, ambitious, and exciting project-based learning workshops.

### Students learn life skills.
Alpha students learn life skills like teamwork, leadership, grit, entrepreneurship, public speaking, and financial acumen. During these workshops, students tackle ambitious projects individually or with a group of their peers. Workshops are not just participatory. Success is determined by an objective Test to Pass (T2P) so students demonstrate their capabilities and mastery of the life skill.`,
  },
  {
    key: 'how-alpha-works',
    group: 'About Alpha',
    title: 'How Alpha Works',
    body: `Alpha is separated into five multi-age levels: Learning Lab (LL), Level 1, Level 2, Middle School, and High School. Each level has a specific curriculum that is part of a larger, whole-school continuum organized by subject.

**Levels at Alpha {{city}}:**

{{levels_list}}

Alpha tracks student academic progress and that information is available on the student dashboard, Timeback.

Alpha uses NWEA's Measure of Academic Progress (MAP) test to measure 2x learning and academic growth. The MAP test is administered three times a year and allows Alpha to track academic progress, measure 2x learning, and identify areas where a student's academic resume needs support. Student achievement and growth results are shared with students and parents after every MAP test.

As a part of developing ownership and a strong work ethic, students are encouraged to work on their goals at home if they did not complete them during the academic day. To that point, each student is issued a laptop for the entirety of the school year and they may take that laptop home after school and on weekends.

Each Alpha day begins with a Limitless Launch. Limitless Launch is Tony Robbins for students. It is a time for guides to instill in students the belief that they are limitless. Growth mindset behaviors and strategies, examples of kids doing impossible things, and teamwork activities are used to develop kids' limitless mindset.

A Guide's job is to provide emotional and motivational support and hold high standards for each student. Alpha believes this is the magic that unlocks each student's limitless potential. Guides develop student's growth mindset, learn their interests and passions, and coach them to new heights. Guides also build and deliver challenging and exciting workshops that develop students' limitless life skills.

The Alpha school year begins in early September and ends in the middle of June. The year is separated into five sessions that run approximately seven weeks each. Alpha maintains traditional Thanksgiving and winter breaks.`,
  },

  // ── Daily Schedule & Procedures ─────────────────────────────────────────────
  {
    key: 'daily-schedule',
    group: 'Daily Schedule & Procedures',
    title: 'Daily Schedule',
    body: `Schedules vary by Level and session. Daily schedules for each Level are available on ParentSquare. Questions regarding schedule changes and variations should be directed to the Campus Coordinator.`,
  },
  {
    key: 'daily-items',
    group: 'Daily Schedule & Procedures',
    title: 'Daily Items to Bring to Alpha',
    body: `- Weather-appropriate clothing and shoes
- Backpack or other school bag
- School-issued laptop and charger
- Water bottle with lid
- Lunch (if not participating in Alpha lunch program)
- Writing utensils and a notebook`,
  },
  {
    key: 'check-in-out',
    group: 'Daily Schedule & Procedures',
    title: 'Check-In and Check-Out',
    body: `Student well-being is our primary concern. To assist in keeping our students safe and accounted for, we ask that parents adhere to the following procedures:

- If planning to arrive at Alpha after the school day begins ({{school_start_time}}), parents should notify the Campus Coordinator via ParentSquare. Students are responsible for checking in with a Guide upon arrival.
- When picking up students early, parents or authorized pickup persons should notify the Campus Coordinator via ParentSquare of student departure. Students may not be released to adults not listed on the authorized pickup list.
- To discuss absences, late arrivals, early releases, or changes to authorized pickup persons, notify the Campus Coordinator via ParentSquare.`,
  },
  {
    key: 'drop-off-pick-up',
    group: 'Daily Schedule & Procedures',
    title: 'Drop-Off and Pick Up',
    body: `### Drop-off
- All traffic enters at {{entrance_desc}}.
- Cars should pull into {{dropoff_zone_desc}} and then exit back onto the street.
- Guides and security guards will be stationed to escort students safely into the building beginning at {{dropoff_start_time}}. For early drop-off, parents must contact the Campus Coordinator.
- Drop-off is from {{dropoff_window}} Students will be escorted to the campus.
- Students are not permitted to enter the building before or after school without an Alpha staff member or adult present.
- Students are considered tardy after {{tardy_time}}

### Pick-up
- Dismissal begins at {{dismissal_time}} for all students.
- Students will not be released to walk to parked cars off-campus.
- Parents and approved guardians may park and walk into the main lobby at the main entrance.
- We ask families to arrive at {{arrival_request_time}} and check in with the security guard.
- At {{dismissal_time}}, students will be escorted by a guide to the lobby for dismissal.

Parents may provide written permission for their children to leave campus unattended at the end of the day once the student is {{unattended_release_age}}. Additionally, parents must notify the school any time their child will leave campus with anyone not already on their authorized pick up list. Alpha does not assume responsibility for student safety once they leave the campus grounds. Please contact the Campus Coordinator for additional information.`,
  },
  {
    key: 'lunch-program',
    group: 'Daily Schedule & Procedures',
    title: 'Lunch Program',
    body: `Families may enroll students in the Alpha lunch program. If you have not done so already, or you would like to learn more on how to enroll, email registrar@alpha.school. Alpha uses a 3rd party Lunch Provider. Menus are shared in advance via ParentSquare. The menu features organic, seasonal fruits and vegetables and contains a variety of high-quality, clean foods. The program offers vegan, dairy-free, and gluten-free options to accommodate students with dietary restrictions (most days). Please contact the Campus Coordinator for more information.`,
  },
  {
    key: 'health-services',
    group: 'Daily Schedule & Procedures',
    title: 'Health Services',
    body: `Alpha does not have a nurse on campus. If your student requires medication during the school day, please contact your Campus Coordinator via ParentSquare. Students may not keep any kind of medication, prescription or over-the-counter, in their locker or backpack.

In the case of illness, students who have vomited due to sickness or have a fever in excess of 100.4° F may not come to school until they are fever-free without the help of fever-reducing medication and have not vomited for at least 24 hours. Fever-reducing medicine does NOT stop the spread of germs. If your child has a fever or has experienced vomiting or diarrhea, do not bring them to school.

All Alpha staff is CPR and First Aid certified annually. If a student becomes sick at school, staff will immediately notify parents and/or the emergency contact listed to arrange pick-up. In the event of an emergency, staff will call 911 immediately and inform the parents and/or the emergency contact provided.

In the case of lice identification, Alpha requires that the infected student is treated before returning to school. Lice checks are performed within the student's level when lice is identified. Students who are found to have live bugs or viable nits will be sent home immediately and may not return to school until treated. Alpha will also alert parents if nits that are not viable are found.

Any additional health or medical information may be provided directly via ParentSquare.`,
  },
  {
    key: 'safety',
    group: 'Daily Schedule & Procedures',
    title: 'Safety',
    body: `Trusting Alpha with the safety and well-being of your children is of the utmost importance to Alpha staff. All employees undergo two background checks. Alpha's third-party HR company completes the first, then Alpha performs an FBI Background Check independently. The FBI Background Check includes fingerprinting.

Once hired, Alpha staff complete several mandatory trainings to learn and practice Alpha's health and safety protocols. Please see the Staff Training section of this handbook for further details. Topics covered in required training include: recognizing and reporting abuse and neglect, behavior management, CPR, first aid, driving safety, fire drills, incident reporting, and internet safety, among others.

Building access is restricted to Alpha staff. Alpha {{city}} has {{security_presence}} present on campus. All visitors, including parents, must be admitted through the front desk check-in or through pre-arranged planning with the Campus Coordinator.

Students are only allowed outside of the school building if an adult is accompanying them. This includes Q-breaks, lunch, and outdoor Core Skills or workshops. During the first week of school, students undergo an orientation in which they review which areas they can access, and which areas are out-of-bounds. Students who violate safety expectations and attempt to access out-of-bounds areas will be subject to having their outdoor privileges restricted.

Please refer to the Check-In and Check-Out, Pick-Up and Drop-Off, Health Services, Staff Training, Cell Phone Policy, Code of Conduct, Technology Acceptable Use Policy, and Off-Campus Travel sections of this handbook for more information on Alpha safety precautions.

Alpha's safety and risk management protocols are regularly reviewed by Alpha's legal counsel, Husch Blackwell as well as our insurance provider, The Leavitt Group.`,
  },
  {
    key: 'emergency-response',
    group: 'Daily Schedule & Procedures',
    title: 'Emergency Response Procedures',
    body: `### Evacuation Procedures
Evacuation routes are clearly posted in all classrooms and common areas. Our primary assembly area is {{primary_assembly}}, with a secondary assembly area at {{secondary_assembly}}. All staff have assigned emergency roles to ensure a safe and organized response.

### Shelter-in-Place
We have assigned locations within the school for shelter-in-place. All shelter-in-place decisions are made in consultation with building management and {{emergency_mgmt_agency}}.

### Training & Drills
We conduct fire and evacuation drills regularly in compliance with state law. At least two staff members maintain active CPR and AED certification, and required fire safety certifications.

### Emergency Communication Protocol
In any emergency, the Campus Coordinator will send an immediate notification to all families via ParentSquare. By default, all families will be notified via Push Notification and Email. If you would like to receive these alerts as a text message also, please make sure your phone number is registered in your ParentSquare account.

To add or update your phone number, navigate to My Account → Edit in ParentSquare and enter your number in the Cell Phone field. Alternatively, you are welcome to share your preferred phone number with us and we can update it from our end.

**Our campus emergency contacts are:**
- **{{head_of_school_name}}** | Head of School: {{head_of_school_phone}}
- **{{lead_guide_name}}** | Lead Guide: {{lead_guide_phone}}
- **{{campus_coordinator_name}}** | Campus Coordinator: {{campus_coordinator_phone}}`,
  },

  // ── Policies ────────────────────────────────────────────────────────────────
  {
    key: 'two-hour-learning',
    group: 'Policies',
    title: '2-Hour Learning',
    body: `Adaptive software allows flexibility and accommodation for absences due to travel and other major life events. 2-Hour Learning is the remote mode of school that allows students to keep up their academic work while not participating in daily, on-campus programming. Please contact the Campus Coordinator for more information or visit ParentSquare.

### 2-Hour Learning Commitment Contract
As a participant in the 2-Hour Learning program, I understand that I am responsible for maintaining the same high standards of learning and conduct as I would on campus. By signing this contract, I commit to the following expectations:

**Commitment to Academic Progress**
- I will complete my assigned daily units on time and ensure consistent academic progress.
- I will track my learning goals using Dash and stay accountable to my academic milestones.

**Commitment to Communication**
- I will maintain frequent communication with my guide, providing updates on my progress and seeking support when needed.
- I will attend any scheduled virtual check-ins or meetings as agreed upon with my guide.

**Accountability and Responsibility**
- I will manage my time effectively to balance my academic responsibilities with other activities.
- I will promptly address any challenges that interfere with my progress by discussing them with my guide.
- I will continue to progress through my check chart projects independently.

**Respect for School Materials**
- I will take care of any school-provided materials, including laptops or other learning tools, ensuring they remain in good condition.
- I will return all materials upon completion of the 2-Hour learning program or when requested by the school.

**Commitment to Alpha Values**
- I will uphold Alpha's values of responsibility, respect, and a growth mindset, representing the school positively while participating in 2-Hour Learning.
- I understand that my success in the 2-Hour Learning program depends on my dedication and willingness to stay on track with my academic and personal growth goals.

Student Name: \\_\\_\\_\\_ Student Signature: \\_\\_\\_\\_ Date: \\_\\_\\_\\_

**Parent/Guardian Acknowledgment** — I have reviewed this contract with my child and support their commitment to the expectations outlined above.

Parent/Guardian Name: \\_\\_\\_\\_ Parent/Guardian Signature: \\_\\_\\_\\_ Date: \\_\\_\\_\\_

**Lead Guide Acknowledgment** — I have reviewed this contract with the student and support their commitment to the expectations outlined above.

Lead Guide Name: \\_\\_\\_\\_ Lead Guide Signature: \\_\\_\\_\\_ Date: \\_\\_\\_\\_`,
  },
  {
    key: 'attendance',
    group: 'Policies',
    title: 'Attendance',
    body: `Students are expected to attend each school day to ensure program continuity. Excessive absences will be addressed by the Head of School when impeding the student's ability to participate in academic programs and workshops. Absences for religious purposes and observances are permitted.

Parents are expected to notify the Campus Coordinator of all late arrivals, early dismissals, or absences via ParentSquare.`,
  },
  {
    key: 'cell-phone',
    group: 'Policies',
    title: 'Cell Phone Policy',
    body: `Students may not use cell phones during school hours at the {{city}} campus, unless communicating with parents. Students must first receive permission from Guides to use a cell phone to communicate with parents during the school day. This communication should be short and not interrupt school programming. Cell phones should be stored in student lockers or cubbies when not in use.`,
  },
  {
    key: 'behavior',
    group: 'Policies',
    title: 'Behavioral Infractions and Consequences Policy',
    body: `### Purpose
At Alpha, we believe that students learn best within a supportive community that values safety, respect, and personal responsibility. Our behavior policy is designed to help students understand the impact of their actions, take ownership of their behavior, and repair relationships when harm occurs. Consequences are developmentally appropriate, consistent, and intended to reinforce accountability and growth.

### Levels of Infractions

**1. Light-Weight Infraction**
Light-weight infractions are minor behaviors that disrupt the learning environment or show disregard for community expectations.

Examples include:
- Running in the hallways or on the stairs
- Repeatedly talking over peers or adults

Consequences:
- Student receives a Yellow Card (or Yellow Light)
- Parents are informed by the student
- Some levels may include Alpha fines, where students "pay" Alphas as a consequence (used as a reflective accountability system)

**2. Middle-Weight Infraction**
Middle-weight infractions involve more serious or repeated breaches of community standards.

Examples include:
- Misuse of technology
- Repeated defiance of community norms or expectations
- Damaging school or personal property

Consequences:
- Student receives a Red Card (or Red Light)
- Parents are informed by the Lead Guide, Dean of Parents, or Head of School

**3. Heavy-Weight Infraction**
Heavy-weight infractions are serious violations that compromise safety or integrity.

Examples include:
- Lying, cheating, or stealing
- Hitting or violence with intent to harm

Consequence Level: Strike

A Strike represents a significant breach of Alpha's values. Receiving three (3) Strikes within a single school year results in removal from the Alpha community. Strikes reset at the beginning of each school year. While strikes reset each school year to allow for a fresh start, repeated serious behaviors or ongoing safety concerns may carry forward and influence continued enrollment decisions.

### Strike Process
When a student earns a Strike during the school day, the following steps occur:
- The Lead Guide, Dean of Parents, or Head of School calls parents to inform them of the incident.
- For non-violent strikes, students may remain on campus and continue their school day.
- For violence-related strikes (intent to harm another or a risk to oneself):
  - The student must be picked up immediately for the safety of others.
  - The student must miss the next day of school.
  - If another student was harmed, an Incident Report is completed.
- Students who receive a strike must issue a public apology to the community at Town Hall.
- Younger students may write a letter of apology instead of delivering one verbally.
- In younger levels, students receive a Behavior Plan upon return to school to support positive behavior changes.

### Behavior Plan and Reflection
Students on a Behavior Plan engage in guided reflection and goal-setting. Examples include:
- Completing a Behavior Plan Write-Up
- Tracking progress through a Behavior Tracker

### Philosophy on Consequences
Our preference is to keep students in school and engaged in learning during any strike-related reflection period.

### Appeal Process and Working Off Strikes
- Strikes for violent actions with clear intent to harm cannot be worked off.
- Strikes related to accidental actions or contextually reactive behaviors may be reviewed and, if appropriate, worked off through restorative action and demonstrated growth.

**Determining Intent**
- Determining intent involves thoughtful review of all available information — student and guide statements, context, and any injuries.
- The school leadership team makes final determinations based on the evidence and the child's best interest.`,
  },
  {
    key: 'dress-code',
    group: 'Policies',
    title: 'Dress Code',
    body: `The dress code at Alpha is relaxed, but should project an image of neatness, modesty, and good taste. Daily dress should be appropriate for movement and outside activity. Students may keep jackets, athletic or water shoes, or weather-specific items in lockers or cubbies.

Students are encouraged to dress in a manner appropriate to the occasion. Daily Alpha attendance, off-campus trips, and events all demand different attire. At any time, a Guide may require a student to change into more appropriate clothing if they deem the student to be out of dress code.

For general campus wear, students must be attired in clothing which is modest and respectful. Clothing must not carry advertisements for tobacco, alcohol products or bars, or promote the use of illicit substances. Clothing with obscene, disrespectful, or offensive messages may not be worn. Students must bring functional shoes, sneakers, or sandals to school each day.`,
  },
  {
    key: 'homework',
    group: 'Policies',
    title: 'Homework Policy',
    body: `The Alpha academic day is structured for students to learn at a 2x faster rate than an average school's academic day in 2 hours a day. This allows for all student work to be completed during the school day. A student may be given a personalized recommendation for work to be completed at home. This may be any supplemental work to help a student get to grade level or reach personal academic goals.`,
  },
  {
    key: 'outside-food',
    group: 'Policies',
    title: 'Outside Food Recommendations',
    body: `In an effort to establish healthy habits, Alpha asks parents to refrain from sending students with high-sugar snacks and treats. This includes items brought to school for celebrations, student-run businesses, and mid-day snacks. For questions on appropriate treats and student allergies, please contact the Campus Coordinator.`,
  },
  {
    key: 'staff-training',
    group: 'Policies',
    title: 'Staff Training',
    body: `Alpha staff convenes for training several times a year. Alpha staff has staff in-service days for two weeks in August and for three days after each academic session. We use this time to train staff on academic tools, finalize curriculum and motivational plans, reset the space, and complete health, safety, and other necessary training as needs arise.

All staff annually participate in the following training:
- Abuse and neglect identification and process training
- Behavior management training
- CPR training
- Driving test for school vehicles
- Emergency response plan training
- Fire drill training (5x per year)
- First aid certification
- Incident report training
- Internet filtering and safety training (academic staff)
- MAP test proctor training (academic staff)
- Mandatory Reporting training through the relevant state agency

Additionally, every staff member has daily and weekly work units that are evaluated. Communication for professional development is consistent and routine.`,
  },
  {
    key: 'technology',
    group: 'Policies',
    title: 'Technology',
    body: `Alpha uses adaptive software, internet resources, and technology-enabled hardware to support personalized learning. Each Alpha student receives school-issued devices for educational use throughout the school year. These devices are Alpha property designed to enhance student learning both at school and at home.

**Device Assignment:**
- Students may receive laptops, MacBooks, iPads, or other devices as determined by their level and educational needs
- Specific device assignments are made based on curriculum requirements and grade-level appropriateness
- All devices include educational software and age-appropriate content filtering

**Device Use Guidelines:**
- Students must bring their devices to school each day if taken home the previous day
- School-issued devices used on the Alpha network are monitored and filtered for age-appropriate educational content
- Students are fully responsible for their device care and security, both on and off campus
- Families are accountable for costs related to damage, loss, or theft of student-issued devices

**Personal Device Policy:** Students should leave personal computers and tablets at home unless needed for specific applications unavailable on school devices. Any personal device use requires prior approval from Alpha Academics. Alpha's monitoring and filtering systems cannot protect students on devices not managed by the school.

**Charger and Accessory Policy:** Alpha provides chargers and accessories upon request for short-term use. Borrowed items must be returned within five school days of the student's return to campus. Families will be charged replacement costs if items are not returned. For device-specific charger recommendations, please contact student.management@alpha.school.`,
  },
  {
    key: 'tech-repair',
    group: 'Policies',
    title: 'Technology Repair Policy',
    body: `Alpha provides each student with devices to support their educational journey. The following policies ensure devices remain functional while establishing clear expectations for families.

### Warranty and Repair Process
**Standard Coverage:**
- Each device includes manufacturer warranty coverage for normal use
- Alpha handles all warranty-eligible repairs at no cost to families
- Repairs typically completed within 5 business days
- Loaner devices available during all repair periods

**Family Responsibility:**
- Families are responsible for repair or replacement costs when damage exceeds warranty coverage
- All repair costs are billed to the family's tuition account
- Damage assessment completed by Alpha technology staff using standardized criteria

**Device-Specific Replacement Costs:**
- Laptop repair or replacement maximum: $700
- MacBook repair or replacement maximum: $700
- iPad repair or replacement maximum: $300
- Other device repair costs: Vary by device type and will be communicated when assigned
- Protective case replacement: $35 (all device types)
- Charger replacement: $50 (all device types)

### Damage Assessment Guidelines
**Warranty Coverage Includes:**
- Normal wear from daily educational use
- Manufacturing defects
- Battery degradation from regular use
- Software issues

**Family Responsibility Includes:**
- Any damage, loss, or issues not covered under warranty

### Summer Device Policy
**Returning Students:**
- All returning students may take their devices home during summer break
- Devices must be returned on the first day of the following school year
- Failure to return device results in full replacement charge (Laptop: $700, MacBook: $700, iPad: $300, other devices: varies)
- Returned devices undergo assessment for school-year readiness

**Pre-School Year Device Check:** Before the first day of school, please ensure your student's device has:
- Power-on capability and wifi connection
- Intact screen without cracks or dark spots
- All buttons/keys present and functional (MacBooks: all keys; iPads: home button/touch ID)
- Working touch functionality (MacBook: trackpad; iPad: touchscreen)
- Functional headphone connection
- Protective case in good condition
- Original charging cable and adapter

If the device does not meet any of the above, please email student.management@alpha.school before the first day of school.`,
  },
  {
    key: 'tech-aup',
    group: 'Policies',
    title: 'Technology Acceptable Use Policy',
    body: `Terms and conditions for use of the Alpha network, hardware, access to the internet and applications:

The Alpha network and internet access is available to students and staff at Alpha. Our goal in providing these technologies is to promote educational excellence at Alpha by facilitating resource sharing, innovation, and communication.

With access to computers and people all over the world comes the availability of material that may not be considered of educational value in the context of the school setting. Alpha takes available precautions to restrict access to inappropriate materials. However, on a global network it is impossible to control all materials and a user may discover inappropriate information.

The smooth operation of the Alpha network relies upon the proper conduct of the end users, students and staff, who must adhere to strict guidelines. The guidelines are provided here so that you are aware of the responsibilities you are about to acquire. In general, this requires efficient, ethical, and legal utilization of the Alpha network, internet and email resources. If an Alpha user violates any of these provisions, their access may be terminated and future access could be denied.`,
  },
  {
    key: 'internet-terms',
    group: 'Policies',
    title: 'Internet — Terms and Conditions',
    body: `**Acceptable Use:** The purpose of the Alpha network and access to the internet is to support research and education in and among Alpha programs. School use of these resources must be in support of education and consistent with the educational objectives. Use of another organization's network or computing resources must comply with the rules appropriate for that network. Transmission of any material in violation of any U.S. or state regulation is prohibited. This includes, but is not limited to; copyrighted material, threatening or obscene material, or material protected by trade secret. Use for third-party product advertisement or political lobbying is also prohibited. Use for commercial activities not sanctioned as school-appropriate is not acceptable.

**Privileges:** The use of the internet is a privilege, not a right, and inappropriate use may result in cancellation of those privileges. Inappropriate use of the internet or Alpha network will call for disciplinary measures. The administrative team will determine what is inappropriate use and their disciplinary decision is final. The administrative team may deny, revoke, or suspend specific user access.

**Netiquette:** You are expected to abide by the generally accepted rules of the Alpha network, internet, and email etiquette. These include, but are not limited to the following:
- Be polite. Your messages should not be abusive to others.
- Use appropriate language. Do not swear, use vulgarities or any other inappropriate language.
- Do not reveal your personal address or phone number or the addresses and/or phone numbers of students or colleagues.
- Illegal activities are strictly forbidden.
- Note that electronic mail (e-mail) or messaging on the Alpha domain is not guaranteed to be private. Administrators do have access to all mail. Messages relating to or in support of illegal activities may be reported to the authorities.
- Do not use the network in such a way that you would disrupt the use of the network by other users.

**Warranty:** Alpha makes no warranties of any kind, whether expressed or implied, for the service it is providing. Alpha will not be responsible for any damages suffered. This includes loss of data resulting from delays, non deliveries, misdeliveries, or service interruptions caused by negligence, errors, or omissions. Use of any information obtained via the Alpha network is at the users own risk. Alpha is not responsible for the accuracy or quality of information obtained.

**Security:** Security on any computer system is a high priority, especially when the system involves many users. If you feel you can identify a security problem on the internet, you must notify a Guide who will in turn notify an information technology professional. Do not demonstrate or exploit any problems.`,
  },
  {
    key: 'off-campus-travel',
    group: 'Policies',
    title: 'Off-Campus Travel',
    body: `Students regularly take off-campus trips accompanied by Alpha staff. Upon completing enrollment forms, all families note their agreement to off-campus travel in the Waiver of Liability. Many workshops leave campus to utilize community resources regularly for the duration of the workshop block or for one-off experiences to support programming.

Third-party transportation options are used for off-campus travel. All students and adults must wear seatbelts while riding in any vehicle. Students may not sit in the front passenger seat of any vehicle. In compliance with {{state}} State Law, all students under the age of {{booster_seat_age}} must use booster seats in every ride. When traveling off campus, Guides take any life-saving medication stored on campus for students in their group, first-aid kits, and a binder with emergency contacts and Consent to Treat forms.`,
  },
  {
    key: 'recordings',
    group: 'Policies',
    title: 'Policy on Recordings',
    body: `Alpha is committed to providing an environment where families can engage in robust conversations about the school and its students. The purpose of this policy is to respect the privacy of Alpha families, employees, and children and to eliminate the chilling effect that secret recordings can have on the robust expression of views. Secret recording of conversations inhibits an open exchange of ideas and cultivates an atmosphere of distrust that is antithetical to the mission of Alpha.

This policy applies to all members of the Alpha community.

It is a violation of Alpha policy to record conversations, phone calls, images, or organizational meetings with any recording device (including but not limited to a cellular telephone, PDA, digital recording device, digital camera, etc.) in all Alpha-related meetings and events unless all parties to the conversation give their consent in advance. Any violation of this policy will result in corrective action.`,
  },
  {
    key: 'privacy',
    group: 'Policies',
    title: 'Privacy Policy',
    body: `Our privacy policy can be found online here: School Privacy Policy.`,
  },

  // ── Additional Resources ────────────────────────────────────────────────────
  {
    key: 'academic-resources',
    group: 'Additional Resources',
    title: 'Academic Resources',
    body: `If a student is in need of specialized support, please contact the Lead EQ Coach via ParentSquare.`,
  },
  {
    key: 'alpha-currency',
    group: 'Additional Resources',
    title: 'Alpha Currency',
    body: `Students earn Alphas, which are wooden tokens students receive as payment for achievements. Students may "cash in" their Alphas (at the cadence determined by each level) for real US dollars (conversion rates vary by session). The Alpha Emporium are other options for spending Alphas.`,
  },
  {
    key: 'glossary',
    group: 'Additional Resources',
    title: 'Glossary of Terms',
    body: `**Alphas:** Alphas are school currency. Students can earn Alphas by achieving their daily goals or Session Goals.

**2-Hour Learning:** This remote mode of school allows students to keep up their academic work while not participating in daily, on-campus programming. Additional information can be found on ParentSquare.

**Alpha Emporium:** Students may use their Alphas to purchase items in their Level 'store.' Items available for purchase vary.

**Closing:** Level-specific afternoon meetings that wrap up the school day. Students have the opportunity to recognize each other for their achievements and positive behavior.

**Core Skills:** Students work on core academic subjects using adaptive software or have coaching sessions with Academic coaches to work on a specific topic. This morning portion of the day allows Alpha to fulfill its second promise: Students learn 2x faster in 2 hours.

**Endorsements:** Endorsements are used in LL and Linc to recognize and reinforce positive behavior. Students recognize one another for being independent, persistent, respectful, attentive, accepting of feedback, courageous, self-regulating, and collaborative.

**Dean of Parents:** Serve as your main point of contact for questions or concerns outside of operations.

**Free Time:** The 45 minute period of time that is combined with lunch time. Students can enjoy outdoor activities or participate in a non-academic activity indoors.

**Guide:** Guides are motivational coaches, rather than traditional teachers. They coach and mentor students through their daily challenges and help them achieve their limitless goals. They are the emotional and motivational support that enforces the high standards Alpha expects of its students.

**Lead Guide:** The Lead Guide is responsible for ensuring that Alpha delivers on its three commitments to every student: love school, learn 2x in 2 hours, and build essential life skills. Lead Guides construct workshop programming for the year, build motivational and behavioral models for their campus, and coach guides to mentor every student.

**Limitless Launch:** A daily morning gathering, either level-specific. Limitless Launch starts the day with instilling in kids the belief that they are limitless and can do anything with a growth mindset.

**Limitless Meeting:** A 1:1 weekly meeting between a student and their guide to dive deeply into the student's motivation, obstacles and passions. As students level up, these meetings become led by the students: students schedule their meetings, set goals for the meeting, and come prepared with an agenda.

**Mobile Squad:** An incentivized event earned by meeting Session Goals. Students earn the opportunity to go on a day-long trip, adventure, or experience outside the Alpha campus.

**Motivational Model:** While almost everything about Alpha is self-directed, we've found that a variety of tools can be helpful in pushing kids to do their best. Each level has tools specially designed to motivate students in their age range to do their best work.

**Parent Council:** The Alpha Parent Council is a group of parents that fosters social and community engagement among Alpha families and supports and enriches Alpha programming. The Council has four areas of primary focus: Parent Outreach, Social Connections, Community Service, and Alpha Enrichment. To learn more about engaging with the parent council, visit ParentSquare.

**Qualified Break (Q-break):** Q-breaks are 10-20 minute breaks taken throughout the school day. Students must qualify for break by completing quality work during CoreSkills.

**Running Buddy:** A mentorship program that gives one student an opportunity to coach and "run with" another student through mastery of a topic. This allows one student the opportunity to gain insight on new strategies and ideas from a peer who has previously accomplished this skill.

**Session:** An academic period, typically of six to eight weeks, that divides the year at Alpha. There are five sessions per year, and each new session implements improvements as determined by staff, introduces a new set of level workshops, and offers an opportunity for students to set new goals.

**Session Goals:** Session Goals are decided upon by Guides and students. These goals are longer term, more difficult than daily goals, and help pace students appropriately through academic content. Session Goals typically earn participation in a Mobile Squad at the end of the session.

**Shadow Buddy:** A current Alpha student who is paired with a student shadowing for potential enrollment.

**Shadow Day and Alpha Chat:** Interested families are invited to send their student to experience a school at Alpha.

**Shadow Student:** A student visiting Alpha for potential enrollment. Shadow students time at Alpha and participate in all programming alongside their shadow buddy.

**Shoutouts:** Community members recognize one another during Closing Meeting for achievements and efforts they noticed throughout that day.

**Town Hall:** A community meeting where students propose changes to shape the school environment (i.e. change a rule, create a rule, etc.). The group votes on the issue to find a creative solution.

**Workshops:** Workshops take place in the afternoon portion of the school day and are project or discussion-based. Students tackle real-life problems as they fulfill Alpha's third promise — Students learn life skills.`,
  },
  {
    key: 'communication-resources',
    group: 'Additional Resources',
    title: 'Communication Resources',
    body: `Staff at the Alpha {{city}} campus can be reached on ParentSquare for emergencies.`,
  },
  {
    key: 'parentsquare',
    group: 'Additional Resources',
    title: 'ParentSquare',
    body: `ParentSquare is designed to be a one-stop shop for frequently requested materials (i.e. forms, directories, schedules, or menus) and quick access to new information (i.e. updates, waivers, etc). Relevant level-specific information is also available through the portal.

To register, please visit the registration page to create a login. Once your account has been created you can easily access the site from the main Alpha website or the direct ParentSquare link. Lead Guides will keep level sections up-to-date with relevant information for your student's level.`,
  },
  {
    key: 'student-contract',
    group: 'Additional Resources',
    title: 'Student Contract',
    body: `### Alpha School Student Commitment Contract
As a student at Alpha School, I commit to upholding the expectations and responsibilities outlined in the Alpha School Student Handbook. I understand that these commitments are essential for my growth, learning, and success. By signing this contract, I agree to the following:

**Commitment to Learning**
- I will complete all my daily academic lessons to the best of my ability.
- I will actively engage in my learning, set goals, and strive for academic growth.
- I will seek support from guides and peers when necessary.

**Commitment to Life Skills Development**
- I will fully participate in life skills workshops and demonstrate effort in Test to Pass (T2P) challenges.
- I will approach challenges with resilience and a growth mindset.

**Respect and Responsibility**
- I will treat my peers, guides, and school staff with respect and kindness.
- I will follow all rules and guidelines as outlined in the student handbook, including the Code of Conduct, Technology Acceptable Use Policy, and Safety Procedures.

**Accountability**
- I will take responsibility for my actions and choices.
- I understand that failure to complete my daily lessons or follow school guidelines may result in appropriate consequences.

**Engagement in the Alpha Community**
- I will contribute to creating a positive, inclusive school environment.
- I will respect the school's property and technology resources.
- I will take ownership of my behavioral and academic expectations and uphold community standards.

I understand that by committing to these expectations, I am taking an active role in my learning and development. I acknowledge that my growth at Alpha is a reflection of my effort and dedication.

Student Name: \\_\\_\\_\\_ Student Signature: \\_\\_\\_\\_ Date: \\_\\_\\_\\_

**Parent/Guardian Acknowledgment** — I have reviewed this contract with my child and support their commitment to the expectations outlined above.

Parent/Guardian Name: \\_\\_\\_\\_ Parent/Guardian Signature: \\_\\_\\_\\_ Date: \\_\\_\\_\\_`,
  },
];

// Each location's field VALUES (and optional per-section overrides).
export const LOCATIONS = [
  {
    code: 'nyc-2026',
    name: 'New York',
    edition: '2026',
    is_active: true,
    fields: {
      campus_name: 'Alpha - Lower Manhattan',
      city: 'New York',
      address: '180 Maiden Lane, New York, New York 10038',
      grades_served: 'grades K–8',
      state: 'New York',
      levels_list: '- Learning Lab (K–1)\n- Level 1 (2–3)\n- Level 2 (4–5)\n- Middle School (6–8)',
      school_start_time: '8:30 a.m.',
      dropoff_window: '8:20–8:30 a.m.',
      dropoff_start_time: '8:20 a.m.',
      tardy_time: '8:45 a.m.',
      dismissal_time: '3:30 p.m.',
      arrival_request_time: '3:25 p.m.',
      entrance_desc: 'the Maiden Lane side entrance on the corner of Front Street and Maiden Lane',
      dropoff_zone_desc: 'the designated drop-off zones on the west and north sides of the building',
      unattended_release_age: 'twelve years of age',
      security_presence: 'at least two security guards',
      primary_assembly: 'the South Street Seaport on Fulton Street (between Front Street and South Street)',
      secondary_assembly: 'Louise Nevelson Plaza on William Street (between Maiden Lane and Liberty Street)',
      emergency_mgmt_agency: 'NYC OEM',
      booster_seat_age: '8',
      head_of_school_name: 'Dr. Tasha Arnold',
      head_of_school_phone: '(224) 550-3103',
      lead_guide_name: 'Liam Stanton',
      lead_guide_phone: '(530) 400-0730',
      campus_coordinator_name: 'Julianne Braime',
      campus_coordinator_phone: '(646) 363-6678',
    },
    overrides: {}, // section_key -> { title?, body?, hidden? }
    academic_year: '2026–2027',
    // calendar filled from NYC_CALENDAR below
  },
  {
    code: 'nashville-2026',
    name: 'Nashville',
    edition: '2026',
    is_active: true,
    fields: {
      campus_name: 'Alpha School Nashville',
      city: 'Nashville',
      address: '1704 Dorothy Pl, Nashville, TN 37212',
      grades_served: 'grades K–8',
      state: 'Tennessee',
      levels_list: '- Learning Lab (K–1)\n- Level 1 (2–3)\n- Level 2 (4–5)\n- Middle School (6–8)',
      school_start_time: '8:00 a.m.',
      tardy_time: '8:00 a.m.',
      dismissal_time: '3:30 p.m.',
      unattended_release_age: 'twelve years of age',
      booster_seat_age: '9',
      head_of_school_name: 'Dr. Tasha Arnold',
      head_of_school_phone: '(224) 550-3103',
      // Remaining campus-physical details (entrance, drop-off zones, evacuation
      // assembly areas, on-site security, local lead/coordinator contacts) are
      // left for the Nashville team to fill in /admin — we don't invent
      // safety-critical information.
    },
    // Tennessee-specific policy provisions woven into the shared handbook.
    overrides: {
      attendance: {
        title: 'Attendance',
        body: `Alpha School Nashville operates on a school calendar that meets Tennessee non-public school requirements, including at least **180 instructional days**. The official attendance day is **8:00 a.m. to 3:30 p.m.**, Monday through Friday, except for holidays, breaks, and other non-instructional days on the school calendar.

Regular attendance is essential to student progress. Please let us know whenever your child will be absent, arriving late, or leaving early. We classify attendance as follows:

- **Excused absence** — supported by a valid reason such as illness, a medical appointment, religious observance, or a family emergency.
- **Unexcused absence** — not supported by a valid reason, required documentation, or timely parent communication.
- **Tardy** — arrival after the 8:00 a.m. start time.
- **Early dismissal** — departure before the 3:30 p.m. end time.

In line with Tennessee compulsory-attendance law, if a student reaches **five unexcused absences** the school will contact the family, review attendance together, identify any barriers, and put reasonable supports in place — such as a parent conference or a written attendance plan. When required by Tennessee law or Tennessee Department of Education guidance, the school reports to the student's district of residence when a student is truant, withdraws, or is expelled.`,
      },
      'health-services': {
        title: 'Health Services & Immunization',
        body: `Alpha School Nashville follows Tennessee health and immunization requirements. Families provide the current immunization documentation required by Tennessee law before or during enrollment, unless a lawful medical or religious exemption applies — in which case the family provides the documentation required for that exemption.

Please keep the school updated with current immunization records, medical information, emergency contacts, and any health information we reasonably need to keep your child safe during the school day. Health and immunization records are kept confidential as part of the student record, except as permitted or required by law.

The school may exclude a student from attendance, condition attendance, or request additional documentation when necessary to comply with applicable health, immunization, or communicable-disease requirements.`,
      },
      safety: {
        title: 'Safety',
        body: `Keeping students safe is our first priority. Every adult who will have direct contact with students at Alpha School Nashville — including guides, staff, contractors, and vendors — must clear a criminal history record check and applicable registry screening **before** they begin working with students.

Screening includes a fingerprint- or Social Security number–based criminal history record check, together with checks of the Tennessee Sex Offender Registry, the National Sex Offender Registry, and the Tennessee Department of Health Abuse Registry, plus any required educator-misconduct or credential review (including TNCompass where applicable). No one begins work involving direct student contact until the school has reviewed the results and cleared them for the role. Screening records are kept confidential.

For campus-specific arrival, dismissal, and emergency procedures, contact the Nashville campus team via ParentSquare.`,
      },
      // Drop-Off/Pick-Up and Emergency Response differ by campus, so they stay
      // visible and prompt the Nashville team to fill in their campus-physical
      // details (drop-off zones & times, entrance, evacuation assembly areas,
      // local contacts) in /admin — unfilled fields show a "campus team to add"
      // prompt rather than a raw placeholder.
    },
    // Tennessee-specific policy provisions added to the Policies section.
    extra_sections: [
      {
        key: 'enrollment-kindergarten',
        group: 'Policies',
        title: 'Enrollment & Kindergarten Age',
        body: `Alpha School Nashville admits students through its admissions and enrollment process, subject to available capacity and the school's ability to serve the student within its program. Families may be asked to provide prior school records, birth-date documentation, health and immunization records, attendance records, or learning-support information for placement and enrollment.

For kindergarten, Tennessee requires a child to be **five years old on or before August 15** of the school year, unless a lawful exception applies and the school documents an approved evaluation process (reviewed by school leadership before enrollment).

The school may use intake activities, baseline assessments, family meetings, or placement reviews to understand readiness and support needs. These are used for instructional planning — not as a substitute for the school's nondiscrimination obligations or its published enrollment process.`,
      },
      {
        key: 'standardized-testing',
        group: 'Policies',
        title: 'Standardized Testing',
        body: `Alpha School Nashville administers the **NWEA MAP Growth** assessment in reading and mathematics as its nationally normed standardized test. Students in **grades 3–8** participate at least annually, and the school may administer MAP Growth more often for instructional planning and progress monitoring.

The Head of School or designee oversees test administration, security, any accommodations required by law, records retention, and communication of results. Results are shared with families and with the student's teachers and instructional staff, and are kept in the student record for at least one year.

Assessment results help monitor academic growth, support placement, and inform family communication — they are not used as the sole measure of student progress.`,
      },
      {
        key: 'records-compliance',
        group: 'Policies',
        title: 'Records & Compliance',
        body: `The Head of School or designee maintains the policies, records, notices, and evidence required for Tennessee Category V approval and ongoing school compliance. The school updates these policies as needed to stay aligned with Tennessee law, State Board rules, Tennessee Department of Education guidance, and school operations.`,
      },
    ],
    academic_year: '2026–2027',
    calendar_template: 'A',
    // calendar + sessions filled from Calendar A below
  },
];

// Known references auto-linked to external resources in the handbook.
// Extendable: add { match, url } and the first occurrence gets hyperlinked.
export const RESOURCE_LINKS = [
  { match: 'NWEA', url: 'https://www.nwea.org/map-growth/' },
  { match: 'Measure of Academic Progress (MAP)', url: 'https://www.nwea.org/map-growth/' },
  { match: 'MAP test', url: 'https://www.nwea.org/map-growth/' },
  { match: 'ParentSquare', url: 'https://www.parentsquare.com/' },
  { match: 'Timeback', url: 'https://timeback.com/' },
  { match: 'School Privacy Policy', url: 'https://2hourlearning.com/privacy/' },
];

// NYC 2026–2027 academic calendar (from the campus calendar PDF).
export const NYC_CALENDAR = [
  { date: '2026-09-08', title: 'First Day of School', category: 'session' },
  { date: '2026-09-15', end: '2026-09-18', title: 'MAP Testing', category: 'testing' },
  { date: '2026-09-21', end: '2026-09-25', title: 'Fall MAP Retesting', category: 'testing' },
  { date: '2026-10-16', title: 'Session 1 Ends', category: 'session' },
  { date: '2026-10-19', title: 'Session 2 Starts', category: 'session' },
  { date: '2026-11-23', end: '2026-11-27', title: 'Thanksgiving Break', category: 'break' },
  { date: '2026-12-18', title: 'Session 2 Ends', category: 'session' },
  { date: '2026-12-21', end: '2027-01-01', title: 'Winter Break', category: 'break' },
  { date: '2027-01-04', title: 'Session 3 Starts', category: 'session' },
  { date: '2027-01-18', title: 'No School / MLK Day', category: 'holiday' },
  { date: '2027-02-01', end: '2027-02-05', title: 'Winter MAP Retesting', category: 'testing' },
  { date: '2027-02-19', title: 'Session 3 Ends', category: 'session' },
  { date: '2027-02-22', end: '2027-02-23', title: 'Session Break', category: 'break' },
  { date: '2027-02-24', title: 'Session 4 Starts', category: 'session' },
  { date: '2027-04-16', title: 'Session 4 Ends', category: 'session' },
  { date: '2027-04-19', end: '2027-04-23', title: 'Session Break', category: 'break' },
  { date: '2027-04-26', title: 'Session 5 Starts', category: 'session' },
  { date: '2027-05-18', end: '2027-05-21', title: 'Spring MAP Testing', category: 'testing' },
  { date: '2027-05-24', end: '2027-05-28', title: 'Spring MAP Retesting', category: 'testing' },
  { date: '2027-05-31', title: 'No School / Memorial Day', category: 'holiday' },
  { date: '2027-06-18', title: 'Last Day of School / Session 5 Ends', category: 'session' },
];

// NYC sessions — used to group the calendar into month grids.
export const NYC_SESSIONS = [
  { name: 'Session 1', start: '2026-09-08', end: '2026-10-16' },
  { name: 'Session 2', start: '2026-10-19', end: '2026-12-18' },
  { name: 'Session 3', start: '2027-01-04', end: '2027-02-19' },
  { name: 'Session 4', start: '2027-02-24', end: '2027-04-16' },
  { name: 'Session 5', start: '2027-04-26', end: '2027-06-18' },
];

// ── Calendar A (Carrollton, Austin, and most campuses) ──────────────────────
export const CALENDAR_A_SESSIONS = [
  { name: 'Session 1', start: '2026-08-12', end: '2026-10-09' },
  { name: 'Session 2', start: '2026-10-19', end: '2026-12-18' },
  { name: 'Session 3', start: '2027-01-04', end: '2027-02-19' },
  { name: 'Session 4', start: '2027-03-01', end: '2027-04-16' },
  { name: 'Session 5', start: '2027-04-26', end: '2027-06-04' },
];
export const CALENDAR_A_EVENTS = [
  { date: '2026-08-12', title: 'First Day of School', category: 'session' },
  { date: '2026-08-18', end: '2026-08-21', title: 'Fall MAP Testing', category: 'testing' },
  { date: '2026-08-24', end: '2026-08-28', title: 'Fall MAP Retesting', category: 'testing' },
  { date: '2026-09-07', title: 'No School / Labor Day', category: 'holiday' },
  { date: '2026-10-09', title: 'Session 1 Ends', category: 'session' },
  { date: '2026-10-12', end: '2026-10-16', title: 'Session Break', category: 'break' },
  { date: '2026-10-19', title: 'Session 2 Starts', category: 'session' },
  { date: '2026-11-23', end: '2026-11-27', title: 'Thanksgiving Break', category: 'break' },
  { date: '2026-12-18', title: 'Session 2 Ends', category: 'session' },
  { date: '2026-12-21', end: '2027-01-01', title: 'Winter Break', category: 'break' },
  { date: '2027-01-04', title: 'Session 3 Starts', category: 'session' },
  { date: '2027-01-18', title: 'No School / MLK Day', category: 'holiday' },
  { date: '2027-02-01', end: '2027-02-05', title: 'Winter MAP Retesting', category: 'testing' },
  { date: '2027-02-19', title: 'Session 3 Ends', category: 'session' },
  { date: '2027-02-22', end: '2027-02-26', title: 'Session Break', category: 'break' },
  { date: '2027-03-01', title: 'Session 4 Starts', category: 'session' },
  { date: '2027-04-16', title: 'Session 4 Ends', category: 'session' },
  { date: '2027-04-19', end: '2027-04-23', title: 'Session Break', category: 'break' },
  { date: '2027-04-26', title: 'Session 5 Starts', category: 'session' },
  { date: '2027-05-18', end: '2027-05-21', title: 'Spring MAP Testing', category: 'testing' },
  { date: '2027-05-24', end: '2027-05-28', title: 'Spring MAP Retesting', category: 'testing' },
  { date: '2027-05-31', title: 'No School / Memorial Day', category: 'holiday' },
  { date: '2027-06-04', title: 'Last Day of School / Session 5 Ends', category: 'session' },
];

// Reusable calendar templates. A new location picks "A" or "B" and its dates
// are copied in. Calendar B = New York; Calendar A = Carrollton, Austin, most.
export const CALENDAR_TEMPLATES = {
  A: { name: 'Calendar A', description: 'Carrollton, Austin & most campuses', sessions: CALENDAR_A_SESSIONS, events: CALENDAR_A_EVENTS },
  B: { name: 'Calendar B', description: 'New York', sessions: NYC_SESSIONS, events: NYC_CALENDAR },
};

// Attach Calendar B to the seeded NYC location (declared here to avoid a TDZ ref).
LOCATIONS[0].calendar = NYC_CALENDAR;
LOCATIONS[0].sessions = NYC_SESSIONS;
LOCATIONS[0].calendar_template = 'B';

// Nashville runs Calendar A (Tennessee, like most campuses).
LOCATIONS[1].calendar = CALENDAR_A_EVENTS;
LOCATIONS[1].sessions = CALENDAR_A_SESSIONS;

export function seedEditorEmails() {
  return (process.env.SEED_EDITOR_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
