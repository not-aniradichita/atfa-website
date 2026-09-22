/* ==========================================================================
   Aniradichita Theatre & Films Association — EVENTS DATA
   --------------------------------------------------------------------------
   The single source of truth for events.html. Add, edit or remove an event
   here — no HTML changes needed. Order in this file does not matter: the
   page sorts and classifies events from their dates.

   HOW TO ADD AN EVENT
     Copy an existing object, give it a unique `id` and `slug`, and fill in
     what you know. Anything unknown: leave it as null (or [] for lists) —
     the page shows "To be announced" for missing upcoming-event details and
     simply hides missing fields on past events. Never guess a date, venue
     or price.

   FIELDS
     id, slug          unique identifiers (slug becomes the detail modal's
                        URL hash, e.g. events.html#e-sunday-decodes)
     title             event name
     tagline           optional one-line hook (upcoming events)
     status            'upcoming' | 'live' | 'past'. Used only when the
                        event has no `date`. When `date` is set, status is
                        computed from the dates (see events.js
                        resolveStatus), so an event moves from Upcoming to
                        Past on its own — Asia/Kolkata time, end of
                        `endDate` (or `date`).
     date, endDate     'YYYY-MM-DD' (endDate for multi-day events) or null
     time              free text, e.g. '6:30 PM IST', or null
     datePublished     'YYYY-MM-DD' — when the archive entry was
                        published. Only a fallback for sorting/labels;
                        NOT the event date.
     type              e.g. 'Movie Screening', 'Online Talk', 'Workshop'
     series, session, topic   optional series name / session number /
                        session theme
     description       short blurb for cards
     longDescription   array of paragraphs for the detail modal
     venue, location   place name / city, or null
     speakers          [{ name, role }]
     collaborators     ['Partner name', ...]
     organizer         only when the event was organised/presented by
                        someone other than Aniradichita
     organizerLabel    optional label for it (default 'Organised by';
                        e.g. 'Presented by')
     dateNote          optional footnote shown under the date
     entry             free text on fee / registration, or null
     images            [{ src, alt, width?, height? }] — first image is
                        the cover. Local files live in assets/. Images
                        hosted on aniradichita.wordpress.com are resized
                        on request (?w=...).
     videos            [{ provider: 'youtube' | 'videopress', id, title }]
     sourceUrl         original archive page — shown as "Original post"
     ticketing         null, or the block described below
     featured          true = shown as the large feature in Live &
                        Upcoming

   TICKETING
     One event can sell more than one kind of ticket (Early Bird /
     Regular, General / VIP, etc.) — each option is its own row with its
     own button and its own external checkout link. Nothing about
     payment happens on this website: every button opens an
     already-hosted Razorpay Payment Page (or any other https checkout
     link) in a new tab.

     ticketing: {
       enabled: true,
       provider: 'razorpay',          // default provider label
       heading: 'Book Your Tickets',  // optional, defaults to that
       options: [
         {
           id: 'early-bird',          // stable id, used in data-* attrs
           label: 'Early Bird Tickets',            // the row's title
           buttonLabel: 'Book Early Bird Tickets',  // shown on the button
           checkoutUrl: 'https://pages.razorpay.com/xxxxxxx', // https
           note: 'Limited-time discounted price.', // optional helper text
           opensAt: null              // optional ISO time to go live later
         },
         { id: 'regular', label: 'Regular Tickets',
           buttonLabel: 'Book Regular Tickets',
           checkoutUrl: 'https://pages.razorpay.com/yyyyyyy' }
       ],
       info: [{ label, value }]        // optional extra rows (price, etc.)
     }

     While an option's checkoutUrl is empty (or its opensAt is in the
     future) its button shows a disabled "Releasing Soon" state instead
     of a link — never a fake checkout. Paste a Razorpay Payment Page URL
     (https://pages.razorpay.com/... or https://rzp.io/l/...) and that
     one option's button goes live — nothing else on the page needs to
     change. A single-ticket event can use one entry in `options`, or the
     older shorthand { enabled, provider, checkoutUrl, buttonLabel } with
     no `options` array — both shapes work (see ticketing.js). All of the
     eligibility/URL-validation logic lives in ticketing.js, kept
     separate from the page markup in events.js.

   Archive entries were imported from
   https://aniradichita.wordpress.com/portfolio/ plus event-like
   pages/posts on that site. Details come from the source text; fields
   the source does not state are left null.
   ========================================================================== */

window.ATFA_EVENTS = [
  {
    "id": "sunday-decodes-2026",
    "slug": "sunday-decodes",
    "title": "Sunday Decodes",
    "tagline": "A movie is waiting to be decoded… Can you guess which one?",
    "status": "upcoming",
    "featured": true,
    "date": "2026-09-27",
    "endDate": null,
    "time": null,
    "datePublished": null,
    "type": "Movie Screening",
    "series": null,
    "session": null,
    "topic": null,
    "description": "A movie screening from Aniradichita Theatre & Films Association — with a twist. The film is a secret: “A movie is waiting to be decoded… Can you guess which one?”",
    "longDescription": [
      "Sunday Decodes is a movie screening presented by Aniradichita Theatre and Films.",
      "The film itself is being kept a mystery: “A movie is waiting to be decoded… Can you guess which one?” Clues are coming — watch out for our next posts & reels.",
      "Choose Early Bird or Regular tickets below to book your seat — payment is completed securely on Razorpay."
    ],
    "venue": null,
    "location": null,
    "speakers": [],
    "collaborators": [],
    "organizer": "Aniradichita Theatre & Films Association",
    "entry": null,
    "images": [
      {
        "src": "assets/sunday-decodes.jpg",
        "alt": "Sunday Decodes movie screening poster: a red neon cinema marquee at night reading “Sunday Decodes — Movie Screening. A movie is waiting to be decoded… Can you guess which one? Tickets releasing soon.” 27.09.26, Aniradichita Theatre & Films Association.",
        "width": 1024,
        "height": 1536
      }
    ],
    "videos": [],
    "sourceUrl": null,
    "ticketing": {
      "enabled": true,
      "provider": "razorpay",
      "heading": "Book Your Tickets",
      "options": [
        {
          "id": "early-bird",
          "label": "Early Bird Tickets",
          "buttonLabel": "Book Early Bird Tickets",
          "checkoutUrl": "https://pages.razorpay.com/EarlyBirdTickets",
          "note": "Limited-time discounted price."
        },
        {
          "id": "regular",
          "label": "Regular Tickets",
          "buttonLabel": "Book Regular Tickets",
          "checkoutUrl": "https://pages.razorpay.com/SundayDecodesTickets",
          "note": null
        }
      ],
      "info": [
        {
          "label": "How to book",
          "value": "Choose Early Bird or Regular above. You'll complete payment securely on Razorpay's own payment page."
        },
        {
          "label": "Price",
          "value": null
        }
      ]
    }
  },
  {
    "id": "wp-page-the-actor-within-2025",
    "slug": "the-actor-within-2025",
    "title": "The Actor Within – Unleash, Perform, Transform",
    "status": "past",
    "date": "2025-03-01",
    "endDate": "2025-03-09",
    "time": null,
    "datePublished": "2025-02-22",
    "type": "Competition",
    "series": null,
    "session": null,
    "topic": null,
    "description": "An elite acting competition by Aniradichita Theatre and Films Association in association with Creative Adda, with video auditions online and a live finale in Mumbai on 9 March 2025.",
    "longDescription": [
      "The Actor Within is an elite acting competition by Aniradichita Theatre and Films Association in association with Creative Adda, designed to push performers to their creative limits. This edition brings a focused approach, emphasizing character immersion, method acting, and real-time performance under expert guidance.",
      "Finalists competed in Mumbai on 9th March 2025, where they performed in front of a live audience and a panel of industry professionals.",
      "Eligibility: anybody of or above 18 years. Participation mode: online (selection round) and offline (finale in Mumbai). Language: all Indian languages and English.",
      "Selection round – video auditions (1st March to 6th March 2025): participants registered and submitted a 2–5 minute video of a monologue performance. Videos were featured on social media, and audience engagement contributed 50% of marks for the selection.",
      "Result announcement and character assignment (7th March 2025): the top 20 performers were announced, and each finalist received a unique character assignment for the finale.",
      "Grand finale – live performance in Mumbai (9th March 2025): live monologue performances before expert judges. Both the audience and the expert judges evaluated the performances, with audience scores combined with the judges’ scores for the final result.",
      "Rewards & recognition: a cash prize of ₹5,000 to the winner and exclusive casting opportunities in theatre, films, and web projects."
    ],
    "venue": null,
    "location": "Mumbai (finale)",
    "collaborators": [
      "Creative Adda"
    ],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "Anybody of or above 18 years; online selection round, offline finale",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2025/02/the-actor-within-poster-4-x-4.png",
        "alt": "The Actor Within – Unleash, Perform, Transform — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2025/02/creative-adda-191-versova-mumbai-photo-studios-z6vdb81.avif",
        "alt": "The Actor Within – Unleash, Perform, Transform — photo 2"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/theactorwithin/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-page-the-artist-within-2024",
    "slug": "the-artist-within-2024",
    "title": "The Artist Within – Unleash, Explore, Shine",
    "status": "past",
    "date": "2024-02-08",
    "endDate": "2024-02-25",
    "time": "Final round: 6:00 PM",
    "datePublished": "2024-02-03",
    "type": "Competition",
    "series": null,
    "session": null,
    "topic": null,
    "description": "“The Artist Within” is an initiative by Aniradichita Theatre and Films Association: a competitive platform for young minds to show creativity across Acting, Stand-up Comedy and Storytelling/Poetry.",
    "longDescription": [
      "“The Artist Within” is an initiative by Aniradichita Theatre and Films Association to provide an innovative competitive platform that provides an opportunity to young minds where you can show your creativity and talent across various artistic domains.",
      "The format may be a competition, but it is more than just competing; it is a celebration of creativity, an exploration of talents, and a journey of self-discovery.",
      "Categories: Acting, Stand-up Comic, and Storytelling/Poetry — each with a Kids category (5 to 17 years) and an Adults category (18 to 40 years).",
      "Round 1 – Evaluation: participants registered in their chosen category and submitted a performance video (2 to 5 minutes, plus a 60 to 90 second cut). Expert scores and public engagement on social media were combined to decide who moved on to Round 2. Round 1 ran 8–16 February 2024, with results on 16 February.",
      "Round 2 – Selection: an online workshop with industry experts on 17 February 2024, followed by performance tasks. Round 2 ended on 22 February, with results on 23 February 2024.",
      "Round 3 – The Grand Finale: an offline workshop for finalists on 24 February 2024, followed by the final performances judged by expert judges and the live audience in the auditorium on 25 February 2024, 6:00 PM, at Deep Auditorium, BBA Building, The Maharaja Sayajirao University of Baroda, Nizampura, Vadodara.",
      "Rewards listed: cash prizes up to ₹18,000, programs worth ₹2,00,000, collaboration opportunities with brands, and opportunities to work with stalwarts of the industry. Category winners were listed to receive a ₹3,000 cash prize, a 1 year membership of “The Thespian’s Tribe” worth ₹12,000, and opportunities for future events, dramas, films and shoots.",
      "Audience members were invited to RSVP to attend the final round and to evaluate the artists from an audience’s perspective."
    ],
    "venue": "Deep Auditorium, BBA Building, The Maharaja Sayajirao University of Baroda, Nizampura",
    "location": "Vadodara",
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "₹99 participation fee per artist per category (non-refundable), as stated at the time",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2024/02/whatsapp-image-2024-01-31-at-11.47.45-am.jpeg",
        "alt": "The Artist Within – Unleash, Explore, Shine — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2024/02/whatsapp-image-2024-02-22-at-5.27.29-pm.jpeg",
        "alt": "The Artist Within – Unleash, Explore, Shine — photo 2"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/the-artist-within/",
    "sourceUrls": [
      "https://aniradichita.wordpress.com/taw2024/",
      "https://aniradichita.wordpress.com/invitationtaw2024/"
    ],
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-post-human-rights-from-education-to-action",
    "slug": "human-rights-from-education-to-action",
    "title": "Human Rights: From Education to Action",
    "status": "past",
    "date": "2021-01-30",
    "endDate": null,
    "time": "2:00 PM EST",
    "datePublished": "2021-01-24",
    "type": "Workshop",
    "series": null,
    "session": null,
    "topic": null,
    "description": "An interactive workshop hosted by Ellen Firestone with special guest Harold D’Souza on the 30 Universal Human Rights, and how to exercise and protect them.",
    "longDescription": [
      "The Interactive Workshop “Human Rights: From Education to Action” was hosted by Ellen Firestone, International Human Rights Ambassador with United for Human Rights, with Special Guest Harold D’Souza, on 30th January 2021.",
      "The Universal Declaration of Human Rights (UDHR) gives us 30 Universal Human Rights. The session threw light on them and helped participants know what rights every human has irrespective of their country, class or ethnicity.",
      "The interaction further educated the audience about conserving their rights, discussed actions and remedies to protect them, and introduced organizations that can help.",
      "The session was hosted by United for Human Rights Central Ohio in collaboration with The Firestone and Eyes Open International on 30th January 2021, 02:00 PM EST.",
      "This entry was published on the Aniradichita blog."
    ],
    "venue": "Online",
    "location": null,
    "speakers": [
      {
        "name": "Ellen Firestone",
        "role": "Workshop host; International Human Rights Ambassador with United for Human Rights"
      },
      {
        "name": "Harold D’Souza",
        "role": "Special guest; Co-founder, Eyes Open International"
      }
    ],
    "collaborators": [],
    "organizer": "United for Human Rights Central Ohio, in collaboration with The Firestone and Eyes Open International",
    "organizerLabel": null,
    "dateNote": null,
    "entry": "RSVP required",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/wp-1611433336742-e1611440873606.jpg",
        "alt": "Human Rights: From Education to Action — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/24993530_1632171223487684_2539236358534677658_n.jpg",
        "alt": "Human Rights: From Education to Action — photo 2"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/blackcropped.jpg",
        "alt": "Human Rights: From Education to Action — photo 3"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/wp-1611440706225.jpg",
        "alt": "Human Rights: From Education to Action — photo 4"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/2021/01/24/harold-dsouza-to-conduct-an-online-interactive-workshop-with-ellen-firestone-on-human-rights/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-post-human-trafficking-a-survivors-story",
    "slug": "human-trafficking-a-survivors-story",
    "title": "Human Trafficking: A Survivor’s Story",
    "status": "past",
    "date": "2021-01-22",
    "endDate": null,
    "time": "12:00 PM EST (one hour)",
    "datePublished": "2021-01-16",
    "type": "Online Session",
    "series": null,
    "session": null,
    "topic": null,
    "description": "An online session chaired by Harold D’Souza on the current scenario of human trafficking, how to identify if somebody is being trafficked and how to get out of the trap.",
    "longDescription": [
      "On 22nd January 2021, Mr Harold D’Souza, a human traffic survivor and Co-Founder and President of Eyes Open International, chaired an online session ‘Human Trafficking: A Survivor’s Story’ organised by helpingtraffickedpersons.org, developed by MCIS Language Solutions.",
      "He shared his experience for awareness of the current scenario of human trafficking and how one can get help. His story is a live example of survival and freedom from 133 months of struggle.",
      "In the session he talked about how a person may fall in the trap of human trafficking, how to identify if somebody is being trafficked and how to get out of the trap.",
      "The session was conducted on the Zoom platform. There were no ticket charges, but registration was necessary. The one-hour session was scheduled at 12:00 PM EST.",
      "This entry was published on the Aniradichita blog under the Events category."
    ],
    "venue": "Online (Zoom)",
    "location": null,
    "speakers": [
      {
        "name": "Harold D’Souza",
        "role": "Human trafficking survivor; Co-Founder and President, Eyes Open International"
      }
    ],
    "collaborators": [],
    "organizer": "helpingtraffickedpersons.org, developed by MCIS Language Solutions",
    "organizerLabel": null,
    "dateNote": null,
    "entry": "No ticket charges; registration necessary",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/20201112204312_1g9a8413.jpg",
        "alt": "Human Trafficking: A Survivor’s Story — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/fb_img_1610780751656.jpg",
        "alt": "Human Trafficking: A Survivor’s Story — photo 2"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/2021/01/16/human-traffic-survivor-harold-dsouza-will-share-his-journey-of-freedom-online-on-human-trafficking-a-survivors-story/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-post-makar-sankranti-skit-vnm-tv",
    "slug": "niyamo-ke-pench-me-fasi-makar-sankranti",
    "title": "Niyamo ke pench me fasi Makar Sankranti",
    "status": "past",
    "date": null,
    "endDate": null,
    "time": null,
    "datePublished": "2021-01-14",
    "type": "Performance",
    "series": null,
    "session": null,
    "topic": null,
    "description": "A skit conceptualized and scripted by Team Aniradichita for VNM TV, on celebrating Makar Sankranti within the pandemic guidelines, with a message of positivity.",
    "longDescription": [
      "The Gujarat High Court announced guidelines on celebrating the festival of Makar Sankranti by following social distancing. Aniradichita Theatre and Films shot a skit on this theme for VNM TV — the first local news channel of Vadodara city.",
      "The skit was conceptualized and scripted by Team Aniradichita, and plots around the theme of the festival along with the pandemic impact. It revolves around a daily scene at a tea stall where people share their experiences during the lock-down and night curfew; a journalist looking for TRP interviews them, along with Pakshiraj (King of Birds) and Pavan Dev (God of the Wind), about the restrictions imposed on the festival.",
      "The message was to give a positive perspective to the community: despite living in a jargon of rules we can be happy and celebrate the festival, because being safe is the best gift we can give each other.",
      "The play was performed exclusively for VNM TV, with the support of Shri Nafis Khan and Ms. Gayatri Vyas. The skit was conceptualised, designed and performed in a short span of 3 days.",
      "Actors: Bhargav Parmar, Anjali Odedra, Namita Pandya, Nirmalsinh Rana, Parshav Shah and Apoorv Thakkar. Production team: Vansh Rajput and Rajesh Tolani. Produced by Aniradichita-Theatre and Films and directed by Shri Aniket Pandya, Founder of Aniradichita-Theatre and Films."
    ],
    "venue": "Performed for VNM TV",
    "location": null,
    "collaborators": [
      "VNM TV"
    ],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/wp-1610632007308.jpg",
        "alt": "Niyamo ke pench me fasi Makar Sankranti — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/wp-1610632007364.jpg",
        "alt": "Niyamo ke pench me fasi Makar Sankranti — photo 2"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/wp-1610632007279.jpg",
        "alt": "Niyamo ke pench me fasi Makar Sankranti — photo 3"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/wp-1610632007217.jpg",
        "alt": "Niyamo ke pench me fasi Makar Sankranti — photo 4"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/wp-1610632007339.jpg",
        "alt": "Niyamo ke pench me fasi Makar Sankranti — photo 5"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2021/01/wp-1610632007252.jpg",
        "alt": "Niyamo ke pench me fasi Makar Sankranti — photo 6"
      }
    ],
    "videos": [
      {
        "provider": "youtube",
        "id": "2UQ3Qrg1pig",
        "title": "Video from the original post"
      }
    ],
    "sourceUrl": "https://aniradichita.wordpress.com/2021/01/14/aniradichita-theatre-and-films-perform-skit-niyamo-ke-pench-me-fasi-makar-sankranti-telecasts-on-vnm-tv/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-3389",
    "slug": "abhivyaktitvam-a-special-theatre-workshop-for-special-ones",
    "title": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones",
    "status": "past",
    "date": "2020-10-10",
    "endDate": null,
    "time": null,
    "datePublished": "2020-10-24",
    "type": "Workshop",
    "series": null,
    "session": null,
    "topic": null,
    "description": "A theatre workshop with mentally special children of the Astitva Foundation, celebrating World Mental Health Day on 10 October 2020, covering acting, dance and music.",
    "longDescription": [
      "Art saves lives, art improves one’s personality, art develops values in our lives, art works as an expressive therapy, art not only serves as a hobby but also as a source of income to many. In a society where special children are looked down upon, we are taking a step to inculcate artistic streak in them through theatre activities. This year we, at Aniradichita, celebrated World Mental Health Day with the mentally special children of Astitva foundation. Want to know what we did with them?",
      "Aniradichita Theatre and Films in association with the Astitva Foundation brought this time a workshop with mentally challenged children to celebrate the World Mental Health Day on 10th October, 2020. A theatre workshop that covered many art forms.There was acting in the workshop, dance, music and a lot of fun. We are going to continue this workshop for an entire month to cultivate love for theatre and drama in the children while also helping them nurture their abilities.",
      "A format of special activities have been formulated to provide children with understanding of expressions, body language, motor skills, stimuli and reflexes. Through the varied activities these children had a fun time learning and improving their skills. A one month long Theatre workshop ‘Abhivyaktitvam’ shall be conducted by Aniradichita to enhance their life skills.",
      "You can also support us by donating for this cause and help us setup a performance arena for them.",
      "The event poster (titled “Abhivyatiyam”) describes the workshop as “a five week walk through the Navarasa”."
    ],
    "venue": null,
    "location": null,
    "collaborators": [
      "Astitva Foundation"
    ],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/abhivyatiyam-without-website-011228.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/wp-1603535264361.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/wp-1603535264397.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — photo 2"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/wp-1603535264473.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — photo 3"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/wp-1603535264424.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — photo 4"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/wp-1603535264324.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — photo 5"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/wp-1603535264452.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — photo 6"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/wp-1603535264498.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — photo 7"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/wp-1603535264525.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — photo 8"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/10/wp-1603535306817.jpg",
        "alt": "Abhivyaktitvam – A Special Theatre Workshop For Special Ones — photo 9"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/abhivyaktitvam-a-special-theatre-workshop-for-special-ones/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-3363",
    "slug": "e-talks-sociotainment-impacting-while-you-entertain",
    "title": "E-Talks: Sociotainment – Impacting While You Entertain",
    "status": "past",
    "date": "2020-09-20",
    "endDate": null,
    "time": "11:30 AM – 1:00 PM IST",
    "datePublished": "2020-09-17",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "A session on films made with a social aspect in mind, and how film making touches bureaucracy and society.",
    "longDescription": [
      "Film making is art and engineering combined to create stories. When a film is made keeping the social aspect in mind and creates an impact, a tributary of film making flows! But what is included in this? How do you move ahead if you want to flow in here? How does film making touch bureaucracy and society? Let us discuss about it.",
      "Aniradichita Theatre and Films in association by The Maharaja Sayajirao University of Baroda brings to you a newer E-Talks; this time with an ‘E-Certificate’ of participation.",
      "To answer your questions on Sociotainment and to taking you to a journey of this new dimension, we have Dr Hemang Joshi: a poet, director and a film maker. Being a perfect example of having a multi-disciplinary profession, he is a practicing HR professional and a PhD Scholar. He has been nominated twice as the Official Delegate in ASEAN – India Youth Delegation and is a national award winner in National Student Parliament by Ministry of Parliamentary Affairs, Government Of India. His notable works include the creation of Cleanliness Anthem in 2015 and ‘Navi Savar’ – A musical documentary and Hope Anthem in 2020 with Government of Gujarat.",
      "There is no entry fee or registration charges! We are going to have some good conversations and games online. We start on 20/9/2020 (Sunday), at 11:30 AM (IST) and try to finish at 01:00 PM. So get ready for some fun learning and entertainment.",
      "Please note that certificates shall be provided to only those who attend the complete session and fill in the feedback form."
    ],
    "venue": "Online",
    "location": null,
    "speakers": [
      {
        "name": "Dr Hemang Joshi",
        "role": "Poet, director and film maker"
      }
    ],
    "collaborators": [
      "The Maharaja Sayajirao University of Baroda"
    ],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "No entry fee or registration charges",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/09/wp-1600361294800.jpg",
        "alt": "E-Talks: Sociotainment – Impacting While You Entertain — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/09/wp-1600365686505.jpg",
        "alt": "E-Talks: Sociotainment – Impacting While You Entertain — photo 1"
      }
    ],
    "videos": [
      {
        "provider": "youtube",
        "id": "OkdizO7HD94",
        "title": "Video from the original post"
      }
    ],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-sociotainment-impacting-while-you-entertain/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-3320",
    "slug": "e-talks-swing-and-sway",
    "title": "E-Talks: Swing and Sway",
    "status": "past",
    "date": "2020-08-16",
    "endDate": null,
    "time": "11:30 AM – 1:00 PM IST",
    "datePublished": "2020-08-12",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "A session on movement and dance, co-hosted with a performer and choreographer, with conversations and games online.",
    "longDescription": [
      "What are you plans post Independence day? Want to have some freedom of movement?Isn’t it beautiful how your body automatically starts swinging to the music you love and you dance our hearts out when the DJ wala babu plays your song! Movements and dance is an important art that every human practices: consciously or sub-consciously! Are you ready for yet another online experience?",
      "Our co-host for the session is Mr Tarang Dalwadi, a registered member of the ‘Indian Film Dance Director Association’ and a performer. He is a performer and a choreographer which gives him a leading edge of understanding the dance form from both the perspectives. His choreography and work has been appreciated by dance masters like ‘D sir (Dharmesh sir)’, Farah Khan, Prabhu Deva sir and many more personalities. He has closely worked with actors like Salman Khan, Ranbeer Kapoor, Malaika Arora Khan, Pulkit Samrat, Jimmy Shergil, etc. He has also contributed in movies like Fukrey, O Teri, Veerey Di Wedding, Dabbang 3 and so on… He has an experience of coaching dancers across the world. He is the official choreographer of Dharmesh Sir’s Dance Academy – D’Virus since 11 years!",
      "There is no entry fee or registration charges! We are going to have some good conversations and games online. We start on 16/8/2020 (Sunday), at 11:30 AM (IST) and try to finish at 01:00 PM. So get ready for some fun learning and entertainment.",
      "Please note that certificates shall be provided to only those who attend the complete session and fill in the feedback form."
    ],
    "venue": "Online",
    "location": null,
    "speakers": [
      {
        "name": "Tarang Dalwadi",
        "role": "Co-host; performer and choreographer, Indian Film Dance Director Association member"
      }
    ],
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "No entry fee or registration charges",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/08/img-20200812-wa0085.jpg",
        "alt": "E-Talks: Swing and Sway — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/08/wp-1597251361478.jpg",
        "alt": "E-Talks: Swing and Sway — photo 2"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-swing-and-sway/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-3301",
    "slug": "e-talks-raaga-rythm-and-rhyme",
    "title": "E-Talks: Raaga, Rythm and Rhyme",
    "status": "past",
    "date": "2020-07-26",
    "endDate": null,
    "time": "11:30 AM – 1:00 PM IST",
    "datePublished": "2020-07-23",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "A session to sail in the ocean of melodies and music: understanding and feeling music and exploring how it influences us.",
    "longDescription": [
      "This Sunday is going to be special because we are going to sail in the ocean of melodies and music! We got an overwhelming response for our first session and now is the time for our next one! Ready with your mug of coffee or cup of tea? We are meeting online again and we are going to have more fun.",
      "Aniradichita Theatre and Films in association by The Maharaja Sayajirao University of Baroda brings to you a newer E-Talks; this time with an ‘E-Certificate’ of participation. The certificate shall be provided after participation. Lets come together to have one of the best experiences of theatre and films by knowing different aspects of art form. Does this have a format of workshop, webinar, lecture? Come, join us and explore it on your own just like they did!",
      "Let us introduce you to our next guest! A singer, a composer an arranger; performed in over 50 shows nationally and internationally; shared stage with singers like Osman Mir and blessed by legends like Shankar Mahadevan and Salim-Sulaiman! Our next session shall be taken by Priyaansh Shaah! Want to know him better? Have a look at his YouTube channel.",
      "The session will start with understanding and feeling music and exploring how it influences us. The session shall be followed by an activity where you shall get a chance to experience a dimension.",
      "There is no entry fee or registration charges! We are going to have some good conversations and games online. We start on 26/July/2020 (Sunday), at 11:30 AM (IST) and try to finish at 01:00 PM. So get ready for some fun and entertainment.",
      "Please note that certificates shall be provided to only those who attend the complete session and fill in the feedback form."
    ],
    "venue": "Online",
    "location": null,
    "speakers": [
      {
        "name": "Priyaansh Shaah",
        "role": "Singer, composer and arranger"
      }
    ],
    "collaborators": [
      "The Maharaja Sayajirao University of Baroda"
    ],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "No entry fee or registration charges",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/07/img-20200722-wa0049.jpg",
        "alt": "E-Talks: Raaga, Rythm and Rhyme — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/07/final-1.png",
        "alt": "E-Talks: Raaga, Rythm and Rhyme — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/07/picsart_07-23-01.13.40.jpg",
        "alt": "E-Talks: Raaga, Rythm and Rhyme — photo 2"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-raaga-rythm-and-rhyme/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-3283",
    "slug": "e-talks-scribbling-sentiments",
    "title": "E-Talks: Scribbling Sentiments",
    "status": "past",
    "date": "2020-07-19",
    "endDate": null,
    "time": "11:30 AM IST",
    "datePublished": "2020-07-16",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "Season two of E-Talks began with a session on writing as an actor and director, and on the genres of story, script and article writing.",
    "longDescription": [
      "We are back! After an overwhelming response of E-talks Season 1, we are back with season two: reloaded. Ready with your mug of coffee or cup of tea? This time,we are meeting online again and we are going to have more fun.",
      "What’s new this time? Well, Aniradichita Theatre and Films in association by The Maharaja Sayajirao University of Baroda brings to you a newer E-Talks; this time with an ‘E-Certificate’ of participation. The certificate shall be provided after participation. Lets come together to have one of the best experiences of theatre and films by knowing different aspects of art form.",
      "Lets talk about our first session! Our first guest is Mr Govind Patel! Govind has an interesting journey which has witnessed aspects of film making, theater and writing. He has been an Associate Director of Crime Patrol dial 100 (Sony TV) for over 20+ episodes.Writing has been a passion for him and hence he has a hand-on experience of writing in different formats right from story writing, screenplay, articles, etc. Currently, he works as a journalist with Sandesh News and his hobbies of photography and acting makes him a multi-talented personality.",
      "The session will start with understanding the aspect of writing as an actor and director and comprehending the different genres of writing namely story writing, script writing, article writing, etc. The session shall be followed by an activity where you shall get a chance to experience a dimension.",
      "There is no entry fee or registration charges! We are going to have some good conversations and games online. We start on 19/July/2020 (Sunday), at 11:30 AM (IST). So get ready for some fun and entertainment."
    ],
    "venue": "Online",
    "location": null,
    "speakers": [
      {
        "name": "Govind Patel",
        "role": "Associate Director, Crime Patrol Dial 100 (Sony TV); journalist, Sandesh News"
      }
    ],
    "collaborators": [
      "The Maharaja Sayajirao University of Baroda"
    ],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "No entry fee or registration charges",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/07/img-20200717-wa0003.jpg",
        "alt": "E-Talks: Scribbling Sentiments — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-scribbling-sentiments/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-3261",
    "slug": "ill-be-there-for-you",
    "title": "I’ll Be There For You",
    "status": "past",
    "date": null,
    "endDate": null,
    "time": null,
    "datePublished": "2020-07-11",
    "type": "Campaign",
    "series": null,
    "session": null,
    "topic": null,
    "description": "A space to vent out and share what is on your mind, anonymously if you want: “I’ll be there for you” — during the tough times of the Corona Virus.",
    "longDescription": [
      "Hey friend,",
      "This is Aniradichita. You know, these times are tough and its not easy to hold yourself. It feels like life has come to stand still and nothing is working out. There’s this Corona Virus which is a common known stress eating us all and then, problems there are uncommon unknown tornado of various emotions eating you within. People want to talk about so many issues around the world but when you talk to somebody about your problems, they are like, “Ugh! We have seen bigger problems than that and have come out of it. Problems are a state of mind… It is the way you take it… Your attitude matters the most… Blah blah blah blah blah…” Why don’t they understand that you don’t want their ‘expert opinion’ or ‘successful solution’ but just an understanding ear to listen to you?",
      "You know, life has changed in the last few months. There’s no safe mall to roam, no cinema to enjoy, no hanging out with friends, no night outs and nothing that used to be a normal stress buster or a venting out event. That feeling of being caged is an addition to your suppressed emotions. You don’t get to hug your friend that often, laughing your lungs out with your tribe, create moments with your loved ones, putting your head on that shoulder pouring all your pain out of your heart or feel serenity in your soul in that lap. Don’t you miss these?",
      "You don’t have words to express, you have somebody to talk to but you don’t feel like. Your pen can’t write, colors can’t paint, melodies don’t flow and everything feels like you are stalemate! This is the worst feeling! It feels like there’s a dead man caged in a living body moving with the herd and pretending to live because sharing the real inner self will further make a piercing cut in the already dead! There are no words to share how it feels.",
      "Well, I am here to tell you something, ‘I’ll be there for you’! I maybe able to give you one thing here – a small breath! Come here and vent out! Don’t limit yourself with words, sentences, language, etc etc. Do you love somebody? Or do you hate somebody? Do you want to confess something? You want to share something to this entire world? Do you have something that needs to be kept a secret and want it to remain so? Is something eating you? Come, share it!",
      "You know what is the best part of it? I’ll keep it anonymous if you want, I can give a shout-out if you want. You get what you want. Just go and scribble. If nothing, just go and let me know that you are ok! All I want is a SMILE 🙂"
    ],
    "venue": "Online",
    "location": null,
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/07/ill-be-there-for-you.jpg",
        "alt": "I’ll Be There For You — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/ill-be-there-for-you/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-1699",
    "slug": "the-actor-within",
    "title": "The Actor Within",
    "status": "past",
    "date": "2020-05-11",
    "endDate": "2020-05-30",
    "time": null,
    "datePublished": "2020-04-27",
    "type": "Competition",
    "series": null,
    "session": null,
    "topic": null,
    "description": "An online acting competition during the COVID-19 lock down: perform a monologue or dialogue video and bring the actor within you out. Round one ran 11–30 May 2020.",
    "longDescription": [
      "The lock down during the COVID-19 pandemic has given good time to introspect. We have all seen times which were least expected. How about digging deep into your own self and exploring the real you?",
      "We have all played different roles at different places. We act different at different places with different people in different situations. You are a different you at the office, at home, at a party and a complete different being with a close friend. How about bringing those versions out of you? It is time to bring the actor within you out now!",
      "Rewards",
      "We, at Aniradichita believe that the best version of you should unleash and the hidden gems you have should be nourished.",
      "For every participant, a participation certificate shall be provided at the end of round two*.",
      "Those selected in round one shall get 1 day workshop and guidance for their better grooming as an actor.",
      "The winner and 1st runner up of each category shall receive acting sessions for free* conducted by Team Aniradichita for the year 2020.",
      "Prior preference* shall be given to the winners for our upcoming theatre and film projects.",
      "The winners shall be rewarded with a digital portfolio exclusively made by Team Aniradichita without any cost* in order to help them enter the industry with a better preparation.",
      "There shall be two rounds to enact your character. The first round gives you the freedom to perform and enact your preferred character. Our internal team shall evaluate your performances and shall be clubbed with the opinion of the public in the ratio of 80(Evaluation score) : 20 (Relative score of audience/public opinion). The selection for the second round shall be done by our team with public opinion and shall be given a specific theme to be performed in the second round.",
      "Who can participate?",
      "Technically, everybody! A student, a teacher, a doctor, an engineer, an employee, an employer, a house wife, a house husband… Anybody and everybody who enjoys a living somebody else’s life for a moment and coming to your own. Those who like mimicing their bosses/teachers, holding a bottle as an award and giving speeches, those who like to sing in the shower or act like a hero/heroine in front of the mirror or in solitude! It is time when the hidden you is introduced…",
      "The participants shall be categorized as follows:",
      "Up to 18 years : Cat 1",
      "19 Years – 45 Years : Cat 2",
      "46 Years and above : Cat 3",
      "Timeline",
      "The time period for the first round shall start on 11/May/2020 to 30/May/2020.",
      "The second round shall get over in the first weak of June and winners shall be announced.",
      "How to participate?",
      "Make sure that the video is min 1 minute and maximum 3 minutes in duration.",
      "For those who want to use facebook, you can upload your video on your fb account, make sure you check-in to our page ‘Aniradichita – Theatres and Films‘ so that we can find you easily and share your performance from our page.",
      "For the users of Instagram, use the hashtag ‘#aniradichita’ , check-in to our Instagram account and mention us in your stories (@aniradichita_theatre_film) so that we can easily find your performance and you don’t go unnoticed. Please make sure your account is open in so that we can access your performance. For the accounts that are private, please change your settings to open. For updates, follow our Instagram Page.",
      "In case you would like to send the video in person, please send it to us personally.",
      "You can post a monologue or a dialogue video. Not more than 2 actors in a video shall be advisable.",
      "The stated rules are for the first round only. The rules for the second round shall be shared with the selected participants.",
      "The languages used for this can be any Indian Language and English.",
      "A video shot on any content creating app shall not be considered. The participant may use an editing software for enhanced performance but grading the performance shall not depend on it."
    ],
    "venue": "Online",
    "location": null,
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "Open to everybody; video entries in any Indian language or English",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/the-actor-within.png",
        "alt": "The Actor Within — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/the-actor-within/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-1793",
    "slug": "e-talks-livraison-du-dialogue-for-canada",
    "title": "E-Talks: Livraison du Dialogue (For Canada)",
    "status": "past",
    "date": "2020-05-04",
    "endDate": null,
    "time": "6:15 PM ET",
    "datePublished": "2020-05-03",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "The E-Talks session “Livraison du Dialogue”, held for Canada: a journey from dialogue to delivery, from words to emotions, from an artist to audience.",
    "longDescription": [
      "Art is raw, it needs to be groomed. An individual has different situations in his/her life to deal with. Your voice reflects the intensity of your emotions and it is important to know the curves with it.",
      "While you hold your cup of tea or a mug of coffee, why not spend your best Tea/Coffee time with us talking about theatre? All you need is a smartphone/laptop, a working internet connection and a zeal to join. Be lazy, be cool; be active, be you! We want this time to not so formal and more of an e-memory!",
      "An excerpt from 2 leading newspapers of Gujarat Talking about E-Talks",
      "Art is raw, it needs to be groomed. Come let’s learn to nourish a voice and travel a journey from dialogue to delivery, a journey from words to emotions, a journey from an artist to audience.",
      "When: May 04 – 06:15 PM (ET)"
    ],
    "venue": "Online",
    "location": null,
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/05/wp-15885270037334456535263970767007.png",
        "alt": "E-Talks: Livraison du Dialogue (For Canada) — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/whatsapp-image-2020-04-18-at-4.08.10-pm.jpeg",
        "alt": "E-Talks: Livraison du Dialogue (For Canada) — photo 1"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-livraison-du-dialogue-for-canada/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-1627",
    "slug": "e-talks-livraison-du-dialogue",
    "title": "E-Talks: Livraison du Dialogue",
    "status": "past",
    "date": "2020-04-25",
    "endDate": null,
    "time": "6:30 PM IST",
    "datePublished": "2020-04-24",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "The fourth E-Talks session: a journey from dialogue to delivery, from words to emotions, from an artist to audience.",
    "longDescription": [
      "Art is raw, it needs to be groomed. An individual has different situations in his/her life to deal with. Your voice reflects the intensity of your emotions and it is important to know the curves with it.",
      "While you hold your cup of tea or a mug of coffee, why not spend your best Tea/Coffee time with us talking about theatre? All you need is a smartphone/laptop, a working internet connection and a zeal to join. Be lazy, be cool; be active, be you! We want this time to not so formal and more of an e-memory!",
      "An excerpt from 2 leading newspapers of Gujarat Talking about E-Talks",
      "Art is raw, it needs to be groomed. Come let’s learn to nourish a voice and travel a journey from dialogue to delivery, a journey from words to emotions, a journey from an artist to audience.",
      "For the fourth session, we have one of the best in town, Naisargi Musale! An avid theatre artist with a flavor of camera acting whose presence can not be ignored. Talking is more than pronunciation and accent and that is what she wants to talk about.",
      "When: April 25 – 06:30 PM (IST)"
    ],
    "venue": "Online",
    "location": null,
    "speakers": [
      {
        "name": "Naisargi Musale",
        "role": "Theatre artist with a flavour of camera acting"
      }
    ],
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/wp-15876889308513698056465265348048.png",
        "alt": "E-Talks: Livraison du Dialogue — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/whatsapp-image-2020-04-18-at-4.08.10-pm.jpeg",
        "alt": "E-Talks: Livraison du Dialogue — photo 1"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-livraison-du-dialogue/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-1555",
    "slug": "e-talks-a-remote-to-emote-for-canada",
    "title": "E-Talks: A Remote to Emote for Canada",
    "status": "past",
    "date": "2020-04-18",
    "endDate": null,
    "time": "10:00 AM EST",
    "datePublished": "2020-04-17",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "The E-Talks session “A Remote to Emote”, held for Canada: talking about the right amount of emotions at the right time.",
    "longDescription": [
      "These are the times when the world is under the Corona stress making it boring and to spice it up a bit, team #aniradichita has come up with ‘E-Talks’! While you hold your cup of tea or a mug of coffee, why not spend your best Tea/Coffee time with us talking about theatre? All you need is a smartphone/laptop, a working internet connection and a zeal to join. Be lazy, be cool; be active, be you! We want this time to not so formal and more of an e-memory!",
      "Look here we are with an exciting 2nd session of E-Talks after successful session themed ‘Char – Actor – ization’. This time to make it more happening and thrilling. Want to know what we did in the last session? Have a look at the video:",
      "This weekend, we shall talk about the right amount of emotions at the right time! You must observed many who over-act in certain situation and spoil the feel? How are you sure that you are not doing that? At this E-talk, take the remote! Its time to Emote!",
      "When: April 18 – 10:00 AM (EST)"
    ],
    "venue": "Online",
    "location": null,
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/wp-15871028375256289021893964471556.jpg",
        "alt": "E-Talks: A Remote to Emote for Canada — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-a-remote-to-emote-for-canada/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-1530",
    "slug": "e-talks-a-remote-to-emote",
    "title": "E-Talks: A Remote to Emote",
    "status": "past",
    "date": "2020-04-17",
    "endDate": null,
    "time": "6:30 PM IST",
    "datePublished": "2020-04-16",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "The 3rd consecutive E-Talks session, on the right amount of emotions at the right time: “At this E-talk, take the remote! It’s time to Emote!”",
    "longDescription": [
      "These are the times of quarantine-lock down and to spice it up a bit, team #aniradichita has come up with ‘E-Talks’! While you hold your cup of tea or a mug of coffee, why not spend your best Tea/Coffee time with us talking about theatre? All you need is a smartphone/laptop, a working internet connection and a zeal to join. Be lazy, be cool; be active, be you! We want this time to not so formal and more of an e-memory!",
      "Look here we are with an exciting 3rd consecutive session of E-Talks after two successful sessions themed ‘Char – Actor – ization’ and ‘Avant Garde Theatre’ on World Theatre Day. This time to make it more happening and thrilling. Want to know what we did in the last session? Have a look at the video:",
      "This evening , we shall talk about the right amount of emotions at the right time! You must observed many who over-act in certain situation and spoil the feel? How are you sure that you are not doing that? At this E-talk, take the remote! Its time to Emote!",
      "For this session, we have a very talented artist, Khadija Ghadiali (currently based in Mumbai)! She has been a part of many theatre productions as a lead actress and also faced camera in feature films and short films. Whether it is backstage or on stage, she has always made her presence felt and an experience worth feeling!",
      "An Excerpt from ‘Gujarat Samachar’ dtd 16-April-2020.",
      "When: April 17 – 06:30 PM (IST)"
    ],
    "venue": "Online",
    "location": null,
    "speakers": [
      {
        "name": "Khadija Ghadiali",
        "role": "Theatre and film artist, Mumbai"
      }
    ],
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/wp-15869807972561219255977655150803.png",
        "alt": "E-Talks: A Remote to Emote — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/wp-1587023260378526232241808273445.jpg",
        "alt": "E-Talks: A Remote to Emote — photo 1"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-a-remote-to-emote/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-1452",
    "slug": "e-talks-charactorization-special-session-for-canada",
    "title": "E-Talks: Char’Actor’ization (Special session for Canada)",
    "status": "past",
    "date": "2020-04-10",
    "endDate": null,
    "time": "5:00 PM – 6:15 PM EST",
    "datePublished": "2020-04-10",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "A special session of “Char’Actor’ization” for Canada: an E-Talk about getting in the skin of the character, with conversations and games online.",
    "longDescription": [
      "Don’t you play different roles at different places? A teammate in the office, friend in a party, a child with parents, etc etc… This E-Talk is about getting in the skin of the character.",
      "To add some fun to life and keeping this live medium of art alive, team #aniradichita has come up with ‘E-Talks’! While you hold your cup of tea or a mug of coffee, why not spend your Tea/Coffee time with us? All you need is a smartphone/laptop, a working internet connection and a zeal to join. Be lazy, be cool; be active, be you! We want this time to not so formal and more of an e-memory!",
      "There is no entry fee or registration charges! We are going to have some good conversations and games online. We start on 10/April/2020 (Friday), at 05:00 PM (EST) and try to finish at 06:15 PM. So get ready for some fun and entertainment."
    ],
    "venue": "Online",
    "location": null,
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "No entry fee or registration charges",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/wp-15865360954687132588130244584345.png",
        "alt": "E-Talks: Char’Actor’ization (Special session for Canada) — featured image"
      }
    ],
    "videos": [
      {
        "provider": "videopress",
        "id": "aMqWmGKx",
        "title": "Video from the original post"
      }
    ],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-charactorization-special-session-for-canada/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-1418",
    "slug": "e-talks-charactorization",
    "title": "E-Talks: Char’Actor’ization",
    "status": "past",
    "date": "2020-04-09",
    "endDate": null,
    "time": "6:30 PM – 7:45 PM",
    "datePublished": "2020-04-08",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "An E-Talk about getting in the skin of the character, with exercises and games online.",
    "longDescription": [
      "Don’t you play different roles at different places? A teammate in the office, friend in a party, a child with parents, etc etc… This E-Talk is about getting in the skin of the character.",
      "To add some fun to life and keeping this live medium of art alive, team #aniradichita has come up with ‘E-Talks’! While you hold your cup of tea or a mug of coffee, why not spend your Tea/Coffee time with us? All you need is a smartphone/laptop, a working internet connection and a zeal to join. Be lazy, be cool; be active, be you! We want this time to not so formal and more of an e-memory!",
      "We have Akash Ukani with us from Surat with is amazing exercises to make this happen. Akash is the founder member of an unconventional and unique theatre group in Surat.",
      "There is no entry fee or registration charges! We are going to have some good conversations and games online. We start on 09/April/2020 (Thursday), at 06:30 PM and try to finish at 07:45 PM. So get ready for some fun and entertainment."
    ],
    "venue": "Online",
    "location": null,
    "speakers": [
      {
        "name": "Akash Ukani",
        "role": "Founder member of a theatre group in Surat"
      }
    ],
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "No entry fee or registration charges",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/wp-15863066956215005791058913254832.jpg",
        "alt": "E-Talks: Char’Actor’ization — featured image"
      }
    ],
    "videos": [
      {
        "provider": "videopress",
        "id": "aMqWmGKx",
        "title": "Video from the original post"
      }
    ],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-charactorization/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-1391",
    "slug": "e-talks-avant-garde-theatre",
    "title": "E-Talks: Avant-Garde Theatre",
    "status": "past",
    "date": "2020-03-27",
    "endDate": null,
    "time": "6:30 PM",
    "datePublished": "2020-03-27",
    "type": "Online Talk",
    "series": "E-Talks",
    "session": null,
    "topic": null,
    "description": "The first E-Talks session, held on World Theatre Day, discussing “Theatre – The mother of all the arts” and Avant-Garde Theatre, online over tea or coffee.",
    "longDescription": [
      "What productive do we do staying home amidst the lock-down? All the passive entertainment is a boon currently but what happens to the live medium then? Happy World Theatre Day!",
      "To add some fun to life and keeping this live medium of art alive, team #aniradichita has come up with ‘E-Talks’! While you hold your cup of tea or a mug of coffee, why not spend your Tea/Coffee time with us? All you need is a smartphone/laptop, a working internet connection and a zeal to join. Be lazy, be cool; be active, be you! We want this time to not so formal and more of an e-memory!",
      "With your friends you have your T(ea) – Talks, with us you can have E-Talks. We shall all be connected and shall be discussing on and about ‘Theatre – The mother of all the arts’. Today’s session is the first session talking about ‘Avant – Garde Theatre’ (Wondering what it is? The session will reveal it today). At the end of the session, be ready for a surprise!!!",
      "While you are wondering why should you spend this time with us, let us tell you one thing! If you like acting, writing, visualizing, story telling, painting, playing, talking, etc etc and most importantly being happy, we are here to give you a nitro boost today in the evening at 06:30 PM!"
    ],
    "venue": "Online",
    "location": null,
    "collaborators": [],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": "Limited entries; online registration form",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/03/picsart_03-27-06.39.36.jpg",
        "alt": "E-Talks: Avant-Garde Theatre — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/e-talks-avant-garde-theatre/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-1468",
    "slug": "a-orison-for-our-corona-warriors",
    "title": "An Orison for our Corona Warriors",
    "status": "past",
    "date": "2020-03-18",
    "endDate": null,
    "time": null,
    "datePublished": "2020-04-13",
    "type": "Campaign",
    "series": null,
    "session": null,
    "topic": null,
    "description": "A one-minute prayer for Corona Warriors: people from 9 countries prayed together on India’s first Janta curfew, 22 March 2020, and from 15 countries later, continuing daily at 13:00 GMT.",
    "longDescription": [
      "The entire world is exposed to the fatal Corona Virus which already has taken over a hundred thousand lives and infected over one and a half million people globally. Under these circumstances, the world has come under one roof and placed humanity above everything. This is a war against this pandemic: a war fought without weapons.",
      "On 18th of March 2020, when the pandemic had affected 166 countries already and India was on the verge of being impacted, we realized that this battle is fought not by guns and bullets while the virus tries to win over the humans, the warriors who are fighting against them need our prayers to fight! Our team prayed for the Warriors and guess what? We felt an energy that was too positive. We thought to share this feeling with others and that same night, we requested people to join.",
      "The idea was simple! Wherever you are, whatever you may be doing, just close your eyes and send good wishes and prayers to the Corona Warriors for a minute. A prayer done together has more power than in fragments. Many joined us and we prayed together.",
      "The word spread and with us came people from over 8 countries. We all decided to pray for our warriors together. 22/March/2020, when India experienced it’s first Janta curfew, we prayed along with 8 other countries. When people of 9 countries (including India) pray together for our Corona Warriors, the cosmos has to bat an eye!",
      "Who are our superheroes in the current times? It is these Corona Warriors who are taking a bullet for us! The reel heroes also joined hands for our real heroes! The Gujarati Film Fraternity came together and prayed for the warriors who are protecting us in real life! We celebrated the World Theatre Day by praying for our Warriors!",
      "“Prayers outlive the lives of those who uttered them; outlive a generation, outlive an age, outlive a world.” E.M Bounds. Today, people from 15 countries come together and pray for our Corona Warriors!",
      "We take this initiative forward! Let us pray for our Warriors everyday! Lets spare a minute everyday and pray together! Keeping in mind the community and their times, we have decided that we shall all pray together at 13:00 hours (GMT + 00:00) everyday for our Corona Warriors! Let us take a moment for those who are risking their lives to save us!"
    ],
    "venue": "Online",
    "location": null,
    "collaborators": [
      "The Gujarati Film Fraternity"
    ],
    "organizer": null,
    "organizerLabel": null,
    "dateNote": null,
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/wp-15868509194643987045188958488402.png",
        "alt": "An Orison for our Corona Warriors — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/wp-15867797130152413187022835857005.jpg",
        "alt": "An Orison for our Corona Warriors — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2020/04/wp-15867797128902615403456979975356.jpg",
        "alt": "An Orison for our Corona Warriors — photo 2"
      }
    ],
    "videos": [
      {
        "provider": "videopress",
        "id": "eE4uIkoZ",
        "title": "Video from the original post"
      }
    ],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-orison-for-our-corona-warriors/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-536",
    "slug": "a-date-with-theatre-with-mahi-joshi-holi-special",
    "title": "A Date With Theatre With Mahi Joshi – Holi Special",
    "status": "past",
    "date": "2019-03-21",
    "endDate": null,
    "time": "10:00 AM – 12:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": null,
    "topic": "Acting: Talent or Hard Work?",
    "description": "A colourful session held on the day of Dhuleti at the Amphitheater at Sayajibaug, Vadodara, on the nuances of acting as a child artist and overcoming the fear of the camera.",
    "longDescription": [
      "“Acting: Talent or Hard Work?”",
      "The session was addressed by one of the most talented child artist in the world of television industry – Ms. Mahi Joshi commonly known as ‘SURI’ for her performance as an actor in one of the most famous serials featured on colours Gujarati.",
      "The session was colorful session held on the day of Dhuleti at the Amphitheater at Sayajibaug, Vadodara. What are the nuances of acting as a child artist plus how one Can overcome the fear of facing the camera were the key discussion areas of the session.",
      "The highlighting element of this session was “Acting in front of a camera for long hours and still holding the same energy”.",
      "Here in this session the members played a game that enhanced their ‘CONCERNTRATION POWER’ and ‘ENERGY’ throughout the course of activity."
    ],
    "venue": "Amphitheater at Sayajibaug",
    "location": "Vadodara",
    "speakers": [
      {
        "name": "Mahi Joshi",
        "role": "Child artist, known as “Suri” on Colors Gujarati"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0010.jpg",
        "alt": "A Date With Theatre With Mahi Joshi – Holi Special — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-with-mahi-joshi-holi-special/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-534",
    "slug": "a-date-with-theatre-at-kaafila-fjc-msu",
    "title": "A Date With Theatre at Kaafila – FJC (MSU)",
    "status": "past",
    "date": "2019-03-15",
    "endDate": null,
    "time": "10:00 AM – 1:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": null,
    "topic": "Theatre Acting and Film Acting",
    "description": "Invited for the annual function of the Faculty of Journalism, covering games and activities on the similarities and dissimilarities of cinema and stage acting. The first time the event was hosted by a faculty at the university.",
    "longDescription": [
      "“Theatre Acting and Film Acting”",
      "For the annual function of ‘Faculty of Journalism’, ‘A Date With Theatre’ was invited for a session.",
      "The session covered games and activities of different aspects of cinema and stage acting.",
      "Getting to know the similarities and dissimilarities of them made the session interesting and equally amazing.",
      "It was for the first time that the event was hosted by a faculty at the Maharaja Sayajirao University."
    ],
    "venue": "Faculty of Journalism and Communication, MSU Baroda",
    "location": null,
    "collaborators": [
      "Kaafila"
    ],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0003.jpg",
        "alt": "A Date With Theatre at Kaafila – FJC (MSU) — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-at-kaafila-fjc-msu/",
    "ticketing": null,
    "featured": false,
    "speakers": []
  },
  {
    "id": "wp-532",
    "slug": "a-date-with-theatre-with-mehul-buch",
    "title": "A Date With Theatre With Mehul Buch",
    "status": "past",
    "date": "2019-02-24",
    "endDate": null,
    "time": "10:00 AM – 12:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": null,
    "topic": "From Acting To Attitude Towards Industry",
    "description": "A session on shaping one’s personality through “attitude”, drawn from a journey from theatres to films and back to theatres.",
    "longDescription": [
      "“From Acting To Attitude Towards Industry”",
      "A session was addressed by one of the most versatile veteran theatre and television artist Mr. Mehul Buch.",
      "The session focused on how one can shape up his personality through “ATTITUDE”.",
      "Mr. Mehul Buch talked about his journey from theatres to films and back to theatres.",
      "He also narrated the various incidences of his life that highlighted the importance of attitude and clear thinking.",
      "The session dealt with understanding the dream of becoming something and the passion to reach at a particular desired destination with a lot of learning during the journey."
    ],
    "venue": "Sarjan Art Gallery, Hobby Centre, Niharika-1, Alkapuri",
    "location": null,
    "speakers": [
      {
        "name": "Mehul Buch",
        "role": "Veteran theatre and television artist"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0002.jpg",
        "alt": "A Date With Theatre With Mehul Buch — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-with-mehul-buch/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-530",
    "slug": "a-date-with-theatre-with-sanat-vyas",
    "title": "A Date With Theatre With Sanat Vyas",
    "status": "past",
    "date": "2019-02-14",
    "endDate": null,
    "time": "6:30 PM – 11:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": null,
    "topic": "In Love With Theatre – Valentine’s Special",
    "description": "A session on how theatre evolved, the challenges then and now, and personal experiences of growing as an actor from theatre to television and movies.",
    "longDescription": [
      "“In Love With Theatre – Valentine’s Special”",
      "A session was addressed by one of the most prominent veteran theatre artist Mr. Sanath Vyas.",
      "The session focussed on how theatre evolved eventually. What contributions Were made in the theatre over a span of a decade.",
      "What were the challenges then And what are the challenges now?",
      "How can one fulfil his dream by connecting to The audience around?",
      "The session also dealt with the personal experiences shared by Shri Sanath Vyas ji about the days when he grew as an actor from theatres to television And finally to movies.",
      "It talked about the differences between these three different mediums Of communication in one form called ‘DRAMA’.",
      "The audience were made aware about The amateur and professional way of learning and performing as a theatre artist."
    ],
    "venue": "Sarjan Art Gallery, Hobby Centre, Niharika-1, Alkapuri",
    "location": null,
    "speakers": [
      {
        "name": "Sanat Vyas",
        "role": "Veteran theatre artist"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0012.jpg",
        "alt": "A Date With Theatre With Sanat Vyas — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-with-sanat-vyas/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-526",
    "slug": "a-date-with-theatre-with-kirtan-patel",
    "title": "A Date With Theatre With Kirtan Patel",
    "status": "past",
    "date": "2019-02-07",
    "endDate": null,
    "time": "8:00 PM – 10:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": null,
    "topic": "From Theatre To Films",
    "description": "A journey from the start of filmmaking to its end: idea, scripting, screenplay, location hunting, casting, directing, editing and producing.",
    "longDescription": [
      "“From Theatre To Films”",
      "“A date with Theatre” invited Kirtan Patel, the versatile writer, director of ‘Back Bencher & Bas Ek Chance’ on “From Theatre to Film”. He took the participants to a journey from the start of a filmmaking to its end. Talking about idea, scripting, screen-play to location hunting, casting, directing to editing and finally producing the film. He taught and explained different shots and angles needed according to the scene and how a good direction is as important as a good script. The session ended with filmmaking aspirants resolving their doubts and queries."
    ],
    "venue": "Ark Café",
    "location": null,
    "speakers": [
      {
        "name": "Kirtan Patel",
        "role": "Writer and director of “Back Bencher” & “Bas Ek Chance”"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0013.jpg",
        "alt": "A Date With Theatre With Kirtan Patel — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/526/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-524",
    "slug": "a-date-with-theatre-with-chetan-dhanani",
    "title": "A Date With Theatre With Chetan Dhanani",
    "status": "past",
    "date": "2019-02-01",
    "endDate": null,
    "time": "8:00 PM – 10:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": 8,
    "topic": "Act It Out",
    "description": "Session 8 was on “The craft of Acting”: method acting, exercises on acting, and an improvised play by the participants themselves.",
    "longDescription": [
      "“Act It Out”",
      "Session 8 of “A date with Theatre” with the actor Chetan Dhanani from the movie Reva was on “The craft of Acting”. He started with sharing his journey of Reva and how he believes in method acting that includes researching from the scratch to knowing your script and the character to believing it’s your own. With that understanding of acting, he started of with exercises on acting. And finally the session ended with a very entertaining play which was an improvise act from the participants themselves."
    ],
    "venue": "Ark Café",
    "location": null,
    "speakers": [
      {
        "name": "Chetan Dhanani",
        "role": "Actor, “Reva”"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0001.jpg",
        "alt": "A Date With Theatre With Chetan Dhanani — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-with-chetan-dhanani/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-522",
    "slug": "a-date-with-theatre-with-rj-dhwani",
    "title": "A Date With Theatre With RJ Dhwani",
    "status": "past",
    "date": "2019-01-24",
    "endDate": null,
    "time": "8:00 PM – 10:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": null,
    "topic": "Speak To Be Heard",
    "description": "A session on voice & speech, from voice modulation to expressing emotions through speech, with several exercises for participants.",
    "longDescription": [
      "“Speak To Be Heard”",
      "This session “A date with Theatre” invited RJ Dhwani from BIG FM and also a theatre artist to interact on “Speak to be heard”. The session was on voice & speech, she had several exercises planned to share with the participants. From voice modulation to expressing emotions through speech, the session was a complete hamper for the participants. Also, Dhwani shared her experience on how theatre gave her confidence to present herself in front of the masses."
    ],
    "venue": "Ark Café",
    "location": null,
    "speakers": [
      {
        "name": "RJ Dhwani",
        "role": "RJ at BIG FM and theatre artist"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0015.jpg",
        "alt": "A Date With Theatre With RJ Dhwani — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-with-rj-dhwani/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-520",
    "slug": "a-date-with-theatre-with-walter-peter",
    "title": "A Date With Theatre With Walter Peter",
    "status": "past",
    "date": "2019-01-17",
    "endDate": null,
    "time": "7:00 PM – 10:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": 6,
    "topic": "Theatre With Change",
    "description": "Session 6 was on “Theatre with a change”: an energetic, interactive session on involving education in theatre, filled with creativity, imagination, dance and music.",
    "longDescription": [
      "“Theatre With Change”",
      "Session 6 was on “Theatre with a change” with Walter Peter, a veteran personality in theatre from National School of Drama and an expert in “ Theatre in Education”. It was the most energetic and interactive session where Mr.Peter taught how to involve education in theatre that is more effective than learning things in theoretical ways. Also, a great theatre presentation makes a huge difference and the role of storyteller is the most important to make a theatre complete. The session was filled with creativity, imagination, dance and music in which everyone lived their heart on sleeves and synced with the energy around."
    ],
    "venue": "iPlex",
    "location": null,
    "speakers": [
      {
        "name": "Walter Peter",
        "role": "Veteran of theatre, National School of Drama; expert in Theatre in Education"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": null,
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0000.jpg",
        "alt": "A Date With Theatre With Walter Peter — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-with-walter-peter/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-518",
    "slug": "a-date-with-theatre-with-dev-keshwala",
    "title": "A Date With Theatre with Dev Keshwala",
    "status": "past",
    "date": "2019-01-10",
    "endDate": null,
    "time": "7:30 PM – 9:30 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": 5,
    "topic": "Ideas: Be Thought, Be Written, Be Filmed",
    "description": "The 5th session was on writing and scripting, taking an idea to a structure with characters and storyline, and ending with writer’s obstacles and tips.",
    "longDescription": [
      "“Ideas: Be Thought, Be Written, Be Filmed”",
      "The 5th session was on writing and scripting with the popular television show “Tarak Mehta ka Ooltah Chashma” writer Dev Keshwala. As the theme of this session was “Ideas! Be thought, Be writing, Be filmed”, it started with the same. From the beginning of the session, the participants were highly interactive while coming up with an idea to giving it structure with characters and storyline. The session ended with discussing about writer’s obstacles and tips to be a good writer."
    ],
    "venue": "iPlex",
    "location": null,
    "speakers": [
      {
        "name": "Dev Keshwala",
        "role": "Writer, “Tarak Mehta ka Ooltah Chashma”"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "The poster prints the year as 2018, but also says Thursday; the weekday and the session order (#4 on 3 Jan 2019, #6 on 17 Jan 2019) point to 10 January 2019.",
    "entry": "Free entry (T&C apply); entry only on advance booking",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0004.jpg",
        "alt": "A Date With Theatre with Dev Keshwala — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-with-dev-keshwala/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-516",
    "slug": "a-date-with-theatre-with-satyendrasinh-parmar-aniradichita",
    "title": "A Date With Theatre With Satyendrasinh Parmar",
    "status": "past",
    "date": "2019-01-03",
    "endDate": null,
    "time": "8:00 PM – 10:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": 4,
    "topic": "Acting Technique and Design",
    "description": "A session on acting techniques for upcoming actors and set design & art direction for upcoming artists and designers, open for questions and interaction.",
    "longDescription": [
      "“Acting Technique and Design”",
      "With a new year, “A date with theatre” invited Satyendrasinh Parmar, the GIFA 2018 award winner for ‘Best Art Director’ and a well-known Theatre director from Ahmedabad. The session was on Acting Techniques and Design. Major emphasis of this session was on acting techniques for upcoming actors and set design & art direction for upcoming artists and designers. Satyendrasinh talked and made the participants practice in from of activities and explained the art of directions with some great visual examples after which the session was left open for questions and interaction with him."
    ],
    "venue": null,
    "location": "Gorwa",
    "speakers": [
      {
        "name": "Satyendrasinh Parmar",
        "role": "GIFA 2018 winner, Best Art Director; theatre director from Ahmedabad"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": "Free entry (T&C apply)",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0005.jpg",
        "alt": "A Date With Theatre With Satyendrasinh Parmar — featured image"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-with-satyendrasinh-parmar-aniradichita/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-505",
    "slug": "a-date-with-theatre-aarjavtrivedi-aniradichita",
    "title": "A Date With Theatre with Aarjav Trivedi",
    "status": "past",
    "date": "2018-12-28",
    "endDate": null,
    "time": "8:00 PM – 10:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": 3,
    "topic": "Theatre and Life",
    "description": "The third session of the season, on how theatre can be connected to life, with exercises to connect emotions and feelings to acting and writing.",
    "longDescription": [
      "About the Guest",
      "Aarjav Trivedi: Aarjav Trivedi is an Indian actor associated with the Gujarati film industry. He rose to fame with his debut movie, Chhello Divas: A New Beginning (2015). After his debut he was seen in Shubh Aarambh (2017), Duniyadari (2017) and Shu Thayu? (2018).",
      "Theatre and Life",
      "Third session of the season was taken by Aarjav Trivedi, famously known as Dhulo from Chhello Divas on Theatre and Life. The session took around how Theatre can be connected to life and can create something beautiful out of it. Aarjav explained how emotions and life incidences could be an inspiration to understand a scene or a character. The session took a start from this idea and then there were exercises and tasks allotted which helped the participants to connect their emotions and feelings to apply in their acting and writing."
    ],
    "venue": null,
    "location": "Gotri",
    "speakers": [
      {
        "name": "Aarjav Trivedi",
        "role": "Actor, Gujarati film industry"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": "Free entry (T&C apply)",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0006-e1554944350137.jpg",
        "alt": "A Date With Theatre with Aarjav Trivedi — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181229-wa0126.jpg",
        "alt": "A Date With Theatre with Aarjav Trivedi — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181229-wa0132.jpg",
        "alt": "A Date With Theatre with Aarjav Trivedi — photo 2"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181229-wa0052.jpg",
        "alt": "A Date With Theatre with Aarjav Trivedi — photo 3"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181229-wa0004.jpg",
        "alt": "A Date With Theatre with Aarjav Trivedi — photo 4"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20190104-wa0042.jpg",
        "alt": "A Date With Theatre with Aarjav Trivedi — photo 5"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181229-wa0007.jpg",
        "alt": "A Date With Theatre with Aarjav Trivedi — photo 6"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181229-wa0028.jpg",
        "alt": "A Date With Theatre with Aarjav Trivedi — photo 7"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-aarjavtrivedi-aniradichita/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-499",
    "slug": "a-date-with-theatre-mitragadhvi-aniradichita",
    "title": "A Date With Theatre with Mitra Gadhvi",
    "status": "past",
    "date": "2018-12-20",
    "endDate": null,
    "time": "8:00 PM – 10:00 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": 2,
    "topic": "Breaking The Basics",
    "description": "The session focussed on expressions, movements, throw as well as dialogue delivery, and how one can still be an altogether different individual in front of the camera.",
    "longDescription": [
      "About the guest",
      "Mitra Gadhvi: Mitra Gadhvi is a film and theatre artist who has been doing theatre since 10 years and considers comedy as meditation. Gadhvi rose to fame as Loy in the movie Chhello Divas : A New Beginning (2015) and was also seen in Bas Ek Chance (2015), Daav Thai Gayo Yaar (2016) and Shu Thayu? (2018). He has started his carrier with Bijoy Nambiyar Production Bollywood movie Fattak which is not released. He has also seen on Crime Patrol on Sony TV. He has written and directed a play named Listen -We need to talk. He has penned lyrics in two video songs .",
      "“Breaking The Basics”",
      "This time Triveni theatre group invited Mitra Gadhvi. The session focussed on expressions, movements, throw as well as dialogue delivery. What impact can theatre bring in one’s life as an actor, plus how one can still be an altogether different individual in front of the camera? Mr. Gadhvi also made every participant act on a given situation – a sort of activity that helps in bringing the actor alive and breaking the ice by acting in front of a new audience. The activity brought a lot of confidence amongst the young theatre artists who acted on the spontaneous situation given to them."
    ],
    "venue": null,
    "location": "Gotri",
    "speakers": [
      {
        "name": "Mitra Gadhvi",
        "role": "Film and theatre artist"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": "Free entry (T&C apply)",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0007.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181220-wa0116.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181220-wa0094.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — photo 2"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181220-wa0073.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — photo 3"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181220-wa0125.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — photo 4"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181220-wa0079.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — photo 5"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181220-wa0045.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — photo 6"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181220-wa0103.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — photo 7"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181220-wa0091.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — photo 8"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181220-wa0074.jpg",
        "alt": "A Date With Theatre with Mitra Gadhvi — photo 9"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-mitragadhvi-aniradichita/",
    "ticketing": null,
    "featured": false
  },
  {
    "id": "wp-481",
    "slug": "a-date-with-theatre-prateekgandhi-aniradichita",
    "title": "A Date With Theatre with Prateek Gandhi and Nikunj Modi",
    "status": "past",
    "date": "2018-12-13",
    "endDate": null,
    "time": "6:30 PM – 8:30 PM",
    "datePublished": "2019-04-11",
    "type": "Theatre Session",
    "series": "A Date With Theatre",
    "session": 1,
    "topic": "The Beginning",
    "description": "The first session of “A date with Theatre” was with the very famous seasoned theatre actor Pratik Gandhi and a young artist soon to be featured in an urban Gujarati film, Nikunj Modi, at Ark Café.",
    "longDescription": [
      "About the Guests",
      "Prateek Gandhi: Pratik Gandhi is an Indian theatre and film actor who primarily works in Gujarati theatre and cinema. He received an opportunity to work in a Gujarati play Aa paar Ke Pele Paar with Firoz Bhagat, Apara Mehta, Vipra Rawal which was about to open in a short period. The play was commercially successful. He was landed a role performing with another stalwart of Gujarati theatre, Manoj Shah. He received a role in the Gujarati film Bey Yaar (2014) which became commercially and critically successful. He continued to work in theatre with several hit plays like Mere Piya Gaye Rangoon, Hu Chandrakant Bakshi as well as Ame Badha Sathe To Duniya Laiye Mathe, in which he played multiple roles. He was included in the Limca Book of Records with his play Mohan’s Masala; a monologue performed in three languages, English, Hindi and Gujarati on the same day. He played a lead role in his next Wrong Side Raju (2016), which also became commercially and critically successful. The film went on to win the National Award for Best Gujarati Film.",
      "Nikunj Modi: Nikunj Modi is an upcoming Film actor in the Gujarati Film Industry. Starting his career as an AD in Mumbai, Nikunj understands the the craft of cinema from both the aspects: behind the camera and on camera. Nikunj has recently shot for upcoming Gujarati films called ‘Safalta 0 km’ directed by Akshay Yagnik where he plays a parallel lead with Dharmesh Yellande popularly known as D sir (ABCD, ABCD 2, Dance Plus) and ‘Bol Gandhi Bol’ directed by Sandeep Navre.",
      "‘The Beginning”",
      "The first session of “A date with Theatre” was with the very famous seasoned theatre actor and a rising Gujarati actor in Hindi film industry Pratik Gandhi and a young artist soon to be featured in an urban Gujarati film Nikunj Modi at Ark Café.",
      "The season’s first episode started with a blast where Pratik Gandhi talked about his journey from theatre to films and how theatre is the root to success for him. From improvising on the spot in theatre to acting in front of the camera, he made sure to acknowledge and answer each questions from the aspirants. Nikunj Modi coming from television journey to films talked about how working behind the scene and learning other process of producing a film helps to become a good actor. Both of them gave practical examples of how to be spontaneous and present while acting."
    ],
    "venue": "Ark Café",
    "location": null,
    "speakers": [
      {
        "name": "Prateek Gandhi",
        "role": "Theatre and film actor"
      },
      {
        "name": "Nikunj Modi",
        "role": "Film actor"
      }
    ],
    "collaborators": [],
    "organizer": "Triveni Theatre Group",
    "organizerLabel": "Presented by",
    "dateNote": "Date, time and venue as printed on the event poster.",
    "entry": "Free entry (T&C apply)",
    "images": [
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/04/img-20190411-wa0008.jpg",
        "alt": "A Date With Theatre with Prateek Gandhi and Nikunj Modi — featured image"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181213-wa0104.jpg",
        "alt": "A Date With Theatre with Prateek Gandhi and Nikunj Modi — photo 1"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181213-wa0097.jpg",
        "alt": "A Date With Theatre with Prateek Gandhi and Nikunj Modi — photo 2"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181214-wa0033.jpg",
        "alt": "A Date With Theatre with Prateek Gandhi and Nikunj Modi — photo 3"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181213-wa0111.jpg",
        "alt": "A Date With Theatre with Prateek Gandhi and Nikunj Modi — photo 4"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181213-wa0100.jpg",
        "alt": "A Date With Theatre with Prateek Gandhi and Nikunj Modi — photo 5"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181213-wa0109.jpg",
        "alt": "A Date With Theatre with Prateek Gandhi and Nikunj Modi — photo 6"
      },
      {
        "src": "https://aniradichita.wordpress.com/wp-content/uploads/2019/06/img-20181214-wa0034.jpg",
        "alt": "A Date With Theatre with Prateek Gandhi and Nikunj Modi — photo 7"
      }
    ],
    "videos": [],
    "sourceUrl": "https://aniradichita.wordpress.com/portfolio/a-date-with-theatre-prateekgandhi-aniradichita/",
    "ticketing": null,
    "featured": false
  }
];
