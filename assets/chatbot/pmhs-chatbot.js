/* Peaceful assistant - topic-aware FAQ chatbot with a crisis safety layer */
(function () {
  "use strict";

  /* ---------------- Knowledge base ---------------- */

  var TOPICS = {
    services:  { label: "\ud83c\udf3f Our services",          intro: "We offer comprehensive psychiatric care for adults. What would you like to know?" },
    visits:    { label: "\ud83d\udcc5 Appointments",          intro: "Happy to help you get seen. Here is what people usually ask about appointments:" },
    telehealth:{ label: "\ud83d\udcbb Telehealth",            intro: "Our secure telehealth brings care to you anywhere in Virginia and Washington State. What can I tell you?" },
    billing:   { label: "\ud83d\udcb3 Insurance & payment",   intro: "Let us sort out the money side. Here is what I can help with:" },
    contact:   { label: "\ud83d\udccd Contact & crisis info", intro: "Here is how to reach us, and what to do in a crisis:" }
  };

  var FAQS = [
    {
      id: "services-overview", topic: "services",
      chip: "What services do you offer?",
      q: "What services does Peaceful Mental Health Services offer?",
      a: "We provide holistic online psychiatric care for adults:\n\n\u2022 Adult psychiatric services\n\u2022 Psychotherapy\n\u2022 Medication management\n\u2022 Diagnostic evaluations\n\u2022 Telehealth services\n\u2022 GeneSight testing\n\u2022 Oncology psychotherapy\n\nFull details on [Our Services](services/).",
      kw: ["services", "offer", "provide", "what do you do", "everything", "list", "treatment"]
    },
    {
      id: "conditions", topic: "services",
      chip: "What conditions do you treat?",
      q: "What conditions do you treat?",
      a: "We treat a full range of mental health conditions, including depression, anxiety and panic, ADHD, bipolar and mood disorders, PTSD and trauma, OCD, sleep problems, postpartum and PMDD, and eating disorders. See the full list on [Conditions We Treat](conditions/).",
      kw: ["condition", "depression", "anxiety", "adhd", "bipolar", "ptsd", "trauma", "ocd", "insomnia", "postpartum", "pmdd", "eating", "diagnos", "what do you treat", "conditions"]
    },
    {
      id: "therapy", topic: "services",
      chip: "Do you offer therapy?",
      q: "Do you offer therapy as well as medication?",
      a: "Yes, both. Psychotherapy here feels like a genuine conversation, not a clinical interview, and it can stand alone or work alongside medication management. Details on [Our Services](services/#psychotherapy).",
      kw: ["therapy", "therapist", "counseling", "counselling", "talk therapy", "psychotherapy", "cbt", "offer therapy", "do therapy", "therapy sessions", "see a therapist"]
    },
    {
      id: "genesight", topic: "services",
      chip: "What is GeneSight testing?",
      q: "What is GeneSight testing?",
      a: "GeneSight is a simple cheek-swab genetic test that shows how your body is likely to respond to different psychiatric medications. It helps your provider find the right medication sooner, with less trial-and-error. Read more on [Our Services](services/#genesight).",
      kw: ["genesight", "gene", "genetic", "dna", "swab", "pharmacogenomic", "test"]
    },
    {
      id: "new-patients", topic: "visits",
      chip: "Are you taking new patients?",
      q: "Are you accepting new patients?",
      a: "Yes! We are welcoming adult patients across Virginia and Washington State, and most new patients are seen within one to two weeks. You can [request an appointment](contact/) in a few minutes.",
      kw: ["new patient", "accepting", "taking", "availability", "waitlist", "how soon", "openings"]
    },
    {
      id: "book", topic: "visits",
      chip: "How do I book an appointment?",
      q: "How do I book an appointment?",
      a: "Booking is simple and usually takes under 10 minutes: fill out the short form on our [contact page](contact/) and we respond within one business day to schedule your first visit.",
      kw: ["book", "schedule", "appointment", "request", "sign up", "get started", "make an appointment"]
    },
    {
      id: "first-visit", topic: "visits",
      chip: "What happens at the first visit?",
      q: "What should I expect at my first appointment?",
      a: "Your first visit is a comprehensive evaluation: an unhurried conversation about your history, current concerns, and goals. Together you and your provider agree on a treatment plan, and you leave knowing exactly what happens next.",
      kw: ["first", "expect", "initial", "evaluation", "what happens", "intake"]
    },
    {
      id: "cancel", topic: "visits",
      chip: "What if I need to cancel?",
      q: "What if I need to cancel or reschedule?",
      a: "Life happens. We ask for at least 24 hours notice so the time can be offered to another patient. Repeated late cancellations may involve a fee, which we explain in your intake paperwork.",
      kw: ["cancel", "reschedule", "miss", "no show", "no-show", "change appointment", "late"]
    },
    {
      id: "telehealth-how", topic: "telehealth",
      chip: "How does telehealth work?",
      q: "How does telehealth work?",
      a: "After scheduling, you receive a secure video link by email. At your appointment time, open the link on a phone, tablet, or computer with a camera, from any private space. No software installation or technical skill is required.",
      kw: ["telehealth", "video", "virtual", "online", "remote", "how does it work", "zoom", "link"]
    },
    {
      id: "telehealth-where", topic: "telehealth",
      chip: "Where do you see patients?",
      q: "Where are you located and who can you see?",
      a: "All visits are online through secure telehealth. We see adult patients located in Virginia and Washington State at the time of the appointment.",
      kw: ["where", "located", "location", "area", "virginia", "washington", "state", "in person", "in-person", "office", "address", "near me"]
    },
    {
      id: "telehealth-rx", topic: "telehealth",
      chip: "Can you prescribe through telehealth?",
      q: "Can you prescribe medication through telehealth?",
      a: "In most cases yes. Prescriptions are sent electronically to your preferred pharmacy. Certain medications have additional requirements, which your provider will explain during your evaluation.",
      kw: ["prescribe", "prescription", "medication online", "refill", "pharmacy", "controlled"]
    },
    {
      id: "insurance", topic: "billing",
      chip: "Do you take my insurance?",
      q: "What insurance do you accept?",
      a: "We accept most insurance plans, including commercial plans, Medicare, and Medicaid. When you request an appointment we verify your specific benefits before your first visit, so there are no surprises. The carriers we work with are listed on our [Insurance page](insurance/).\n\nNo insurance? Self-pay is available too.",
      kw: ["insurance", "medicare", "medicaid", "coverage", "covered", "plan", "anthem", "aetna", "cigna", "united", "tricare", "in network", "in-network"]
    },
    {
      id: "selfpay", topic: "billing",
      chip: "What if I do not have insurance?",
      q: "Do you offer self-pay options?",
      a: "You can still be seen without insurance. Self-pay options are available if you are uninsured, between plans, or prefer not to use insurance. [Contact us](contact/) and we will walk you through the rates before you commit to anything, so there are no surprises.",
      kw: ["self pay", "self-pay", "cash", "no insurance", "uninsured", "out of pocket", "without insurance", "not insured", "pay myself", "private pay"]
    },
    {
      id: "cost", topic: "billing",
      chip: "How much does a visit cost?",
      q: "How much does it cost?",
      a: "With insurance, your cost depends on your plan (usually your copay or deductible). We verify your benefits before your first visit and let you know what to expect. If you are paying yourself, [contact us](contact/) and we will share our self-pay rates up front.",
      kw: ["cost", "price", "fee", "fees", "how much", "expensive", "afford", "copay", "co-pay", "deductible", "rate", "rates", "charge", "bill", "billing"]
    },
    {
      id: "referral", topic: "billing",
      chip: "Do I need a referral?",
      q: "Do I need a referral?",
      a: "You do not need a referral to request an appointment with us. Some insurance plans require one for specialist care; we check that when we verify your benefits and will let you know.",
      kw: ["referral", "refer", "referred", "primary care", "pcp", "doctor send"]
    },
    {
      id: "ages", topic: "visits",
      chip: "Do you see teens or children?",
      q: "Who do you see? Do you see children?",
      a: "We care for adults, 18 and over. If you are looking for help for a child or teen, their pediatrician or school counselor is a good first step for a referral, and in a crisis you can always call or text 988.",
      kw: ["child", "children", "kid", "kids", "teen", "teens", "teenager", "adolescent", "minor", "son", "daughter", "under 18"]
    },
    {
      id: "states", topic: "telehealth",
      chip: "I live outside Virginia or Washington",
      q: "Can you see me if I live in another state?",
      a: "Our clinicians are licensed in Virginia and Washington State, so you need to be physically located in one of those two states at the time of each visit. If you are elsewhere, your insurance company or the [988 Lifeline](tel:988) can point you to local options.",
      kw: ["another state", "other state", "out of state", "outside", "maryland", "dc", "california", "texas", "new york", "florida", "north carolina", "oregon", "idaho", "georgia", "travel", "traveling", "move", "moving"]
    },
    {
      id: "adhd", topic: "services",
      chip: "Do you treat ADHD?",
      q: "Do you diagnose and treat ADHD?",
      a: "Yes. We evaluate and treat ADHD in adults, starting with a careful diagnostic evaluation. Some ADHD medications have additional prescribing requirements, which your provider explains during your visit.",
      kw: ["adhd", "attention", "focus", "focusing", "concentrate", "concentration", "adderall", "stimulant", "stimulants", "vyvanse", "ritalin"]
    },
    {
      id: "meds", topic: "services",
      chip: "How does medication management work?",
      q: "How does medication management work?",
      a: "Your provider prescribes thoughtfully, starts gently, and checks in regularly to see how you are doing, adjusting doses or switching medications when needed. The goal is the greatest relief with the fewest medications at the lowest effective doses. More on [Our Services](services/#medication).",
      kw: ["medication", "medications", "meds", "medicine", "antidepressant", "ssri", "dose", "dosage", "side effect", "side effects", "pills"]
    },
    {
      id: "privacy", topic: "telehealth",
      chip: "Is it private and confidential?",
      q: "Is my information private?",
      a: "Yes. Your visits happen over a secure video platform and your health information is kept confidential, as required by law. You can read how we handle information in our [Privacy Policy](privacy-policy/).",
      kw: ["private", "privacy", "confidential", "confidentiality", "secure", "safe", "hipaa", "record", "records", "employer", "who will know"]
    },
    {
      id: "hours", topic: "contact",
      chip: "What are your hours?",
      q: "What are your office hours?",
      a: "Our team answers messages Monday to Friday, 9 to 5, and replies to appointment requests within one business day. Visit times are arranged with you when you schedule, and online visits can often fit before or after work.",
      kw: ["hours", "open", "opening", "closed", "weekend", "weekends", "saturday", "sunday", "evening", "evenings", "after work", "business hours"]
    },
    {
      id: "reach", topic: "contact",
      chip: "How do I reach a human?",
      q: "How do I contact the practice?",
      a: "The fastest way is the form on our [contact page](contact/), answered within one business day, Monday to Friday 9 to 5. Phone and email are listed there too.",
      kw: ["contact", "reach", "human", "person", "phone", "call", "email", "talk to someone", "speak"]
    },
    {
      id: "crisis", topic: "contact",
      chip: "What do I do in a crisis?",
      q: "What should I do in a mental health crisis?",
      a: "This chat and our website are not monitored for emergencies. If you or someone you love is in crisis, call or text 988, the Suicide and Crisis Lifeline, available 24/7, or call 911. If it is safe to do so, do not stay alone; reach out to someone you trust as well.",
      kw: ["crisis", "emergency", "hotline", "988", "911"]
    }
  ];

  /* Crisis safety: checked before all other matching, answered instantly. */
  var CRISIS_RE = /\b(suicid\w*|kill(ing|ed)? (myself|me)|end(ing)? (my|it) (life|all)|self.?harm\w*|hurt(ing)? (myself|me)|harm(ing)? (myself|me)|cut(ting)? myself|overdos\w*|want to die|wish i (was|were) dead|don'?t want to (live|be here|wake up)|no reason to live|better off (dead|without me))\b/i;
  var CRISIS_MSG = "I am really glad you told me, and I want you to get real support right now. This chat cannot help in a crisis, but these people can, 24/7:\n\n\u2022 Call or text 988, the Suicide and Crisis Lifeline\n\u2022 Call 911 if you are in immediate danger\n\nYou deserve support, and you do not have to face this alone.";

  var GREETING = "Hi! \ud83d\udc4b I am the Peaceful assistant.";
  var GREETING2 = "What would you like to know? Pick a topic below, or just type your question.";
  var FALLBACK = "Hmm, I do not have a good answer for that one yet. Our team can help directly through the [contact page](contact/), answered within one business day. Or pick a topic below and I will show you what I can help with.";

  var SMALLTALK = [
    { re: /^(hi|hello|hey|hiya|howdy|good\s*(morning|afternoon|evening)|yo)\b/i,
      a: "Hello! \ud83d\ude0a What can I help you with today?", chips: "topics" },
    { re: /\b(thank(s| you)|appreciate|awesome|great|perfect|helpful)\b/i,
      a: "You are very welcome! Is there anything else I can help you with?", chips: "topics" },
    { re: /\b(bye|goodbye|see you|that('s| is) all|no thanks|nothing else)\b/i,
      a: "Take care! If anything else comes up, I am right here. \ud83d\udc9a", chips: "topics" },
    { re: /\b(how are you|how's it going|what's up)\b/i,
      a: "Doing well, thank you for asking! More importantly, how can I help you today?", chips: "topics" },
    { re: /^(help|menu|start over|restart|topics|options)\b/i,
      a: "Sure, here is everything I can help with:", chips: "topics" }
  ];

  /* ---------------- State ---------------- */

  var root, toggle, panel, log, sugg, form, input;
  var BASE = "";
  var state = { started: false, topic: null, asked: [] };
  var history = []; // {text, who}

  function el(id) { return document.getElementById(id); }
  function byId(id) { for (var i = 0; i < FAQS.length; i++) if (FAQS[i].id === id) return FAQS[i]; return null; }

  function saveState() {
    try {
      sessionStorage.setItem("pmChatState", JSON.stringify({ s: state, h: history.slice(-40) }));
    } catch (e) {}
  }
  function loadState() {
    try {
      var raw = sessionStorage.getItem("pmChatState");
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || !data.h || !data.h.length) return false;
      state = data.s || state;
      history = data.h;
      return true;
    } catch (e) { return false; }
  }

  /* ---------------- Rendering ---------------- */

  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  function render(text) {
    // escape, then linkify: [label](relative/path) resolved against the page base, plus 988/911
    return esc(text)
      .replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, function (m, label, path) {
        var href = /^(https?:|tel:|mailto:)/.test(path) ? path : BASE + path;
        return '<a href="' + href + '">' + label + "</a>";
      })
      .replace(/(^|[\s\u2022])(988)\b/g, '$1<a href="tel:988">$2</a>')
      .replace(/(^|[\s\u2022])(911)\b/g, '$1<a href="tel:911">$2</a>');
  }

  function addMsg(text, who, skipSave) {
    var d = document.createElement("div");
    d.className = "pm-msg " + who;
    d.innerHTML = render(text);
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    if (!skipSave) { history.push({ text: text, who: who }); saveState(); }
  }

  // typing indicator, delay scaled to message length, then deliver + follow-up chips
  function botReply(text, chips, done) {
    var t = document.createElement("div");
    t.className = "pm-typing";
    t.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(t);
    log.scrollTop = log.scrollHeight;
    sugg.innerHTML = "";
    var delay = Math.min(1500, 380 + text.length * 4);
    setTimeout(function () {
      t.remove();
      addMsg(text, "bot");
      if (chips) renderChips(chips);
      if (done) done();
    }, delay);
  }

  function chip(label, cls, onClick) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pm-chip" + (cls ? " " + cls : "");
    b.textContent = label;
    b.addEventListener("click", onClick);
    sugg.appendChild(b);
    return b;
  }

  /* Focus mode: "topics" shows the 5 topic chips; a topic id shows ONLY that
     topic's unanswered questions + a back chip; an array shows those FAQs. */
  function renderChips(mode) {
    sugg.innerHTML = "";
    if (mode === "topics") {
      Object.keys(TOPICS).forEach(function (id) {
        chip(TOPICS[id].label, "pm-chip--topic", function () { openTopic(id); });
      });
      return;
    }
    var faqs, backChip = true;
    if (Object.prototype.toString.call(mode) === "[object Array]") {
      faqs = mode;
    } else { // topic id
      faqs = FAQS.filter(function (f) { return f.topic === mode && state.asked.indexOf(f.id) === -1; });
    }
    faqs.forEach(function (f) {
      chip(f.chip, null, function () { answer(f); });
    });
    if (backChip) chip("⟵ All topics", "pm-chip--back", function () { backToTopics(); });
  }

  /* ---------------- Conversation flow ---------------- */

  function openTopic(id) {
    state.topic = id;
    addMsg(TOPICS[id].label.replace(/^\S+\s/, ""), "user");
    botReply(TOPICS[id].intro, id);
    saveState();
  }

  function backToTopics() {
    state.topic = null;
    botReply("Sure, here is everything I can help with:", "topics");
    saveState();
  }

  function answer(f, echoText) {
    addMsg(echoText || f.q, "user");
    state.topic = f.topic;
    if (state.asked.indexOf(f.id) === -1) state.asked.push(f.id);
    var remaining = FAQS.filter(function (x) {
      return x.topic === f.topic && state.asked.indexOf(x.id) === -1;
    });
    botReply(f.a, remaining.length ? f.topic : null, function () {
      if (!remaining.length) {
        // topic exhausted - gently widen the lens again
        botReply("That covers " + TOPICS[f.topic].label.replace(/^\S+\s/, "").toLowerCase() + "! Anything else on your mind?", "topics");
        state.topic = null;
      }
      saveState();
    });
  }

  /* ---------------- Matching engine ---------------- */

  function normalize(s) {
    s = s.toLowerCase().replace(/[\u2018\u2019]/g, "'")
      .replace(/\bcan'?t\b/g, "cannot").replace(/\bwon'?t\b/g, "will not").replace(/n'?t\b/g, " not")
      .replace(/\bi'?m\b/g, "i am").replace(/'s\b/g, "").replace(/'re\b/g, " are").replace(/'ve\b/g, " have");
    return " " + s.replace(/[^a-z0-9@+\-\s]/g, " ").replace(/\s+/g, " ").trim() + " ";
  }

  /* Intent rules catch meaning that single keywords miss ("I don't have insurance" is about self-pay,
     not about which insurance we take). Checked in order, before keyword scoring. */
  var INTENTS = [
    { id: "selfpay", re: /\b(no|not|without|lost|never had|do not have|does not have|have not got|uninsured)\b[^.?!]{0,30}\b(insurance|insured|coverage)\b|\bbetween (insurance|plans|jobs)\b|\buninsured\b|\b(insurance|coverage)\b[^.?!]{0,20}\b(expired|ended|lapsed|ran out|cancelled|canceled)\b/ },
    { id: "insurance", re: /\b(aetna|anthem|cigna|united ?healthcare|uhc|optum|tricare|humana|kaiser|blue ?cross|bcbs|carefirst|sentara|premera|molina|ambetter|regence|medicare|medicaid|in network|take my insurance|accept my insurance)\b/ },
    { id: "adhd", re: /\b(adhd|adderall|vyvanse|ritalin|stimulants?)\b/ },
    { id: "cost", re: /\b(how much|cost|price|afford|expensive|copay|deductible|rates?)\b/ },
    { id: "ages", re: /\b(see|treat|for|help|accept|take) (my |a |your )?(child|children|kids?|teens?|teenagers?|adolescents?|minors?|son|daughter)\b|\b(under 18|\d{1,2} ?(yr|year)s? old|minors?|adolescents?|teenagers?)\b/ },
    { id: "states", re: /\b(another|other|different) state\b|\bout of state\b|\boutside (of )?(virginia|washington|va|wa)\b|\b(maryland|california|texas|new york|florida|north carolina|oregon|idaho|georgia|pennsylvania|new jersey|ohio)\b/ },
    { id: "telehealth-where", re: /\b(in person|in-person|office|clinic|address|come in|visit you|physical location)\b/ },
    { id: "crisis", re: /\b(emergency|crisis)\b/ }
  ];
  function intentFaq(text) {
    var t = normalize(text);
    for (var i = 0; i < INTENTS.length; i++) if (INTENTS[i].re.test(t)) return byId(INTENTS[i].id);
    return null;
  }

  function stem(w) {
    return w.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "").replace(/(.)\1$/, "$1");
  }
  // one typo allowed (insert, delete, swap, replace) for words of 5+ letters
  function near(a, b) {
    if (a === b) return true;
    if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a[i + 1] === b[j] && a[i] === b[j + 1]) { i += 2; j += 2; continue; }
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  function scoreFaq(f, t) {
    var s = 0;
    var words = t.trim().split(" "), stems = words.map(stem);
    f.kw.forEach(function (k) {
      var kk = k.toLowerCase();
      var hit;
      if (kk.indexOf(" ") !== -1) hit = t.indexOf(" " + kk + " ") !== -1 || t.indexOf(" " + kk) !== -1;
      else {
        var ks = stem(kk);
        hit = stems.indexOf(ks) !== -1 || words.some(function (w) { return near(w, kk) || near(stem(w), ks); });
      }
      if (hit) s += (kk.indexOf(" ") !== -1 ? 5 : 2) + Math.min(kk.length / 4, 3);
    });
    // bonus: words from the question itself
    normalize(f.q).split(" ").forEach(function (w) {
      if (w.length > 4 && t.indexOf(" " + w) !== -1) s += 1;
    });
    // context bonus: stay in the current topic when scores tie
    if (s > 0 && state.topic && f.topic === state.topic) s += 0.5;
    return s;
  }

  function matchAll(text) {
    var t = normalize(text);
    return FAQS
      .map(function (f) { return { f: f, s: scoreFaq(f, t) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s; });
  }

  function handleInput(text) {
    text = text.trim();
    if (!text) return;

    // Crisis safety comes before everything else: no scoring, no typing delay.
    if (CRISIS_RE.test(text)) {
      addMsg(text, "user");
      addMsg(CRISIS_MSG, "bot");
      renderChips("topics");
      saveState();
      return;
    }

    var intent = intentFaq(text);
    if (intent) { answer(intent, text); return; }

    var ranked = matchAll(text);
    var strongFaq = ranked.length && ranked[0].s >= 4;

    // small talk - but a confident FAQ match wins ("Great, how do I book?")
    if (!strongFaq) {
      for (var i = 0; i < SMALLTALK.length; i++) {
        if (SMALLTALK[i].re.test(text)) {
          addMsg(text, "user");
          botReply(SMALLTALK[i].a, SMALLTALK[i].chips);
          return;
        }
      }
    }

    if (!ranked.length) {
      addMsg(text, "user");
      botReply(FALLBACK, "topics");
      return;
    }

    var best = ranked[0], second = ranked[1];
    // confident: clear winner
    if (best.s >= 4 && (!second || second.s <= best.s * 0.6)) {
      answer(best.f, text);
      return;
    }
    // ambiguous: let the user pick from the closest matches
    if (second && second.s > best.s * 0.6) {
      addMsg(text, "user");
      var options = ranked.slice(0, 3).map(function (r) { return r.f; });
      botReply("I found a couple of things that might answer that. Which one is closest?", options);
      return;
    }
    // weak single match: answer, but admit uncertainty
    addMsg(text, "user");
    botReply("I think this is what you are after. If not, just rephrase or pick a topic below.\n\n" + best.f.a, best.f.topic);
    state.topic = best.f.topic;
    if (state.asked.indexOf(best.f.id) === -1) state.asked.push(best.f.id);
    saveState();
  }

  /* ---------------- Open / close ---------------- */

  function restoreChips() {
    if (state.topic) renderChips(state.topic);
    else renderChips("topics");
  }

  function open() {
    panel.hidden = false;
    root.classList.add("pm-open", "pm-seen");
    try { sessionStorage.setItem("pmChatSeen", "1"); } catch (e) {}
    toggle.setAttribute("aria-expanded", "true");
    if (!state.started) {
      state.started = true;
      if (loadState() && history.length) {
        history.forEach(function (m) { addMsg(m.text, m.who, true); });
        restoreChips();
      } else {
        addMsg(GREETING, "bot");
        botReply(GREETING2, "topics");
      }
      saveState();
    }
    if (window.matchMedia && window.matchMedia("(min-width: 700px)").matches) input.focus();
  }

  function close() {
    panel.hidden = true;
    root.classList.remove("pm-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  document.addEventListener("DOMContentLoaded", function () {
    root = el("pm-chat");
    BASE = (root && root.getAttribute("data-base")) || "";
    toggle = el("pm-chat-toggle");
    panel = el("pm-chat-panel");
    log = el("pm-chat-log");
    sugg = el("pm-chat-suggestions");
    form = el("pm-chat-form");
    input = el("pm-chat-input");
    if (!toggle) return;

    try { if (sessionStorage.getItem("pmChatSeen")) root.classList.add("pm-seen"); } catch (e) {}

    toggle.addEventListener("click", function () { panel.hidden ? open() : close(); });
    el("pm-chat-close").addEventListener("click", close);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleInput(input.value);
      input.value = "";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) close();
    });
  });
})();
