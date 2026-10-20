(function () {
  "use strict";

  // Perfis neste aparelho: "main" mantém a chave antiga, então os dados existentes continuam valendo
  var P = { list: [{ id: "main", name: "Principal" }], active: "main" };
  try {
    var saved = JSON.parse(localStorage.getItem("mds-profiles"));
    if (saved && saved.list && saved.list.length) P = saved;
  } catch (e) {}
  if (!P.list.some(function (p) { return p.id === P.active; })) P.active = P.list[0].id;
  var STORAGE_KEY = P.active === "main" ? "meu-dia-saudavel-state" : "meu-dia-saudavel-state:" + P.active;
  var WATER_TARGET = 6;

  var MEAL_ITEMS = [
    { id: "breakfast", label: "Café da manhã" },
    { id: "lunch", label: "Almoço" },
    { id: "snack", label: "Lanche" },
    { id: "dinner", label: "Jantar" }
  ];

  var PET_ITEMS = [
    { id: "fed", label: "Alimentar o pet" },
    { id: "water", label: "Trocar a água" },
    { id: "walk", label: "Passear ou brincar" }
  ];

  var FOOD_TIPS = [
    "Experimente incluir uma cor diferente no prato hoje.",
    "Que tal uma fruta como lanche da tarde?",
    "Beber água antes da refeição ajuda a perceber a fome real.",
    "Comer sem pressa ajuda o corpo a sentir saciedade.",
    "Inclua algo crocante hoje: verduras, castanhas ou frutas."
  ];

  var PAUSE_TIPS = [
    { icon: "🌿", text: "Olhe para algo verde por 20 segundos e relaxe os ombros." },
    { icon: "🚶", text: "Levante e dê uma volta pequena, mesmo que seja pela casa." },
    { icon: "🤲", text: "Solte as mãos, gire os pulsos e respire fundo três vezes." },
    { icon: "🎵", text: "Ouça uma música que você goste, sem fazer mais nada." },
    { icon: "🪟", text: "Olhe pela janela e observe algo distante por um minuto." }
  ];

  var MOODS = [
    { id: "otimo", emoji: "😄", label: "Ótimo" },
    { id: "bem", emoji: "🙂", label: "Bem" },
    { id: "neutro", emoji: "😐", label: "Neutro" },
    { id: "cansado", emoji: "😔", label: "Cansado" },
    { id: "dificil", emoji: "😢", label: "Difícil" }
  ];

  var ACHIEVEMENTS = [
    {
      id: "primeiro-dia", icon: "🌱", title: "Primeiro dia", desc: "Complete sua primeira missão do dia.",
      test: function (s) { return s.totalMissionsEver >= 1; }
    },
    {
      id: "sete-dias", icon: "🌿", title: "7 dias de hábitos", desc: "Mantenha uma sequência de 7 dias seguidos.",
      test: function (s) { return s.streak >= 7; }
    },
    {
      id: "dez-missoes", icon: "☑️", title: "10 missões concluídas", desc: "Complete 10 missões diárias, no total.",
      test: function (s) { return s.totalMissionsEver >= 10; }
    },
    {
      id: "semana-completa", icon: "📅", title: "Semana completa", desc: "Tenha 7 dias inteiros com todas as missões feitas.",
      test: function (s) { return s.fullDaysEver >= 7; }
    },
    {
      id: "trinta-dias", icon: "🌳", title: "30 dias — novo visual", desc: "30 dias de sequência desbloqueiam uma nova fase do personagem.",
      test: function (s) { return s.streak >= 30; }
    },
    {
      id: "sessenta-dias", icon: "🏆", title: "Conquista especial", desc: "60 dias de sequência: seu personagem atinge a fase especial.",
      test: function (s) { return s.streak >= 60; }
    },
    { id: "agua-7", icon: "💧", title: "Hidratado", desc: "Bata a meta de água em 7 dias.", test: function (s) { return s.waterDays >= 7; } },
    { id: "agua-30", icon: "🌊", title: "Rio de saúde", desc: "Bata a meta de água em 30 dias.", test: function (s) { return s.waterDays >= 30; } },
    { id: "sono-7", icon: "😴", title: "Sono em dia", desc: "Durma 7h ou mais em 7 dias.", test: function (s) { return s.sleepDays >= 7; } },
    { id: "mov-10", icon: "🏃", title: "Em movimento", desc: "Movimente-se em 10 dias.", test: function (s) { return s.moveDays >= 10; } },
    { id: "humor-7", icon: "🧠", title: "Autoconsciente", desc: "Registre o humor em 7 dias.", test: function (s) { return s.moodDays >= 7; } },
    { id: "pet-5", icon: "🐾", title: "Amigo dos bichos", desc: "Complete os cuidados do pet em 5 dias.", test: function (s) { return s.petDays >= 5; } },
    { id: "pts-500", icon: "⭐", title: "500 pontos", desc: "Acumule 500 pontos.", test: function (s) { return s.points >= 500; } },
    { id: "pts-2000", icon: "🌟", title: "Mestre dos pontos", desc: "Acumule 2000 pontos.", test: function (s) { return s.points >= 2000; } },
    { id: "cem", icon: "💯", title: "100 missões", desc: "Complete 100 missões no total.", test: function (s) { return s.totalMissionsEver >= 100; } },
    { id: "grato-7", icon: "🙏", title: "Coração grato", desc: "Escreva 7 notas de gratidão.", test: function (s) { return s.notesCount >= 7; } }
  ];

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function dateKeyOffset(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function defaultDay() {
    return {
      water: 0,
      sleepStart: "",
      sleepEnd: "",
      moved: false,
      meals: { breakfast: false, lunch: false, snack: false, dinner: false },
      pauseCount: 0,
      mood: null,
      pet: { fed: false, water: false, walk: false },
      streakCounted: false,
      awarded: {}
    };
  }

  function defaultState() {
    return {
      points: 0,
      streak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      totalMissionsEver: 0,
      fullDaysEver: 0,
      unlockedAchievements: [],
      days: {},
      profile: { name: "", birthdate: "", photoData: null },
      settings: { waterGoal: 6, missions: { water: true, sleep: true, moved: true, pause: true } },
      weights: {},
      notes: {},
      char: { equipped: [] }
    };
  }

  var state = null;
  var storageAvailable = true;

  function ensureDay(key) {
    if (!state.days[key]) state.days[key] = defaultDay();
    var d = state.days[key];
    if (!d.meals) d.meals = { breakfast: false, lunch: false, snack: false, dinner: false };
    if (!d.pet) d.pet = { fed: false, water: false, walk: false };
    if (!d.awarded) d.awarded = {};
    return d;
  }

  function applySettings() {
    WATER_TARGET = Math.max(4, Math.min(12, parseInt(state.settings.waterGoal, 10) || 6));
  }

  function award(day, key, pts, mission) {
    if (day.awarded[key]) return;
    day.awarded[key] = true;
    state.points += pts;
    if (mission) state.totalMissionsEver += 1;
  }

  function activeKeys() {
    var m = state.settings.missions;
    return ["water", "sleep", "moved", "pause"].filter(function (k) { return m[k]; });
  }
  function missionTotal() { return Math.max(1, activeKeys().length); }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        state = Object.assign(defaultState(), parsed);
        state.days = parsed.days || {};
        state.profile = Object.assign({ name: "", birthdate: "", photoData: null }, parsed.profile || {});
        state.settings = Object.assign({ waterGoal: 6 }, parsed.settings || {});
        state.settings.missions = Object.assign({ water: true, sleep: true, moved: true, pause: true }, state.settings.missions || {});
        state.char = Object.assign({ equipped: [] }, parsed.char || {});
        state.weights = parsed.weights || {};
        state.notes = parsed.notes || {};
      } else {
        state = defaultState();
      }
    } catch (e) {
      state = defaultState();
    }
    applySettings();
    handleDayRollover();
  }

  function persist() {
    if (!storageAvailable) return;
    try {
      var json = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, json);
      if (window.MDS_onSave) window.MDS_onSave(json);
    } catch (e) {
      storageAvailable = false;
    }
  }

  function handleDayRollover() {
    var tk = todayKey();
    if (state.lastActiveDate && state.lastActiveDate !== tk) {
      var yd = state.days[dateKeyOffset(-1)];
      if (!yd || !yd.streakCounted) state.streak = 0;
    }
    state.lastActiveDate = tk;
    ensureDay(tk);
  }

  function missionStatus(day) {
    var sleepOk = !!(day.sleepStart && day.sleepEnd);
    return {
      water: day.water >= WATER_TARGET,
      sleep: sleepOk,
      moved: day.moved,
      pause: day.pauseCount >= 1
    };
  }

  function missionCount(m) {
    return activeKeys().filter(function (k) { return m[k]; }).length;
  }

  function sleepMinutes(day) {
    if (!day || !day.sleepStart || !day.sleepEnd) return 0;
    var a = day.sleepStart.split(":"), b = day.sleepEnd.split(":");
    var diff = (+b[0] * 60 + +b[1]) - (+a[0] * 60 + +a[1]);
    return diff <= 0 ? diff + 1440 : diff;
  }

  function sleepHoursText(day) {
    if (!day.sleepStart || !day.sleepEnd) return "Registre os dois horários para calcular sua noite de sono.";
    var min = sleepMinutes(day), m = min % 60;
    return "Você dormiu cerca de " + Math.floor(min / 60) + "h" + (m ? pad(m) + "min" : "") + ".";
  }

  function characterStage(streak) {
    if (streak >= 60) return "especial";
    if (streak >= 30) return "arvore";
    if (streak >= 7) return "broto";
    return "semente";
  }

  var STAGE_INFO = {
    semente: { title: "Sua sementinha de hoje", desc: "Cada hábito que você cuida ajuda essa sementinha a criar raízes." },
    broto: { title: "Seu broto está crescendo", desc: "7 dias de sequência já fizeram esse broto ganhar folhas novas." },
    arvore: { title: "Sua árvore ganhou um novo visual", desc: "30 dias de cuidado transformaram o broto em uma árvore firme." },
    especial: { title: "Sua árvore está florida", desc: "60 dias de sequência: uma conquista rara, celebrada com flores." }
  };

  function characterSVG(stage) {
    var potPath = '<path d="M28 78h44l-6 20a6 6 0 0 1-6 5H40a6 6 0 0 1-6-5z" fill="#C97B4B"/><rect x="24" y="70" width="52" height="10" rx="4" fill="#B96A3C"/>';
    var svgOpen = '<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">';
    var svgClose = '</svg>';

    if (stage === "semente") {
      return svgOpen + potPath +
        '<path d="M50 70V56" stroke="#3F7D58" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M50 58c-8-2-10-9-10-9s8-3 13 3z" fill="#3F7D58"/>' +
        '<ellipse cx="50" cy="66" rx="7" ry="6" fill="#8A5A2B"/>' +
        svgClose;
    }
    if (stage === "broto") {
      return svgOpen + potPath +
        '<path d="M50 70V40" stroke="#3F7D58" stroke-width="4.5" stroke-linecap="round"/>' +
        '<path d="M50 50c-12-2-15-13-15-13s11-4 18 5z" fill="#3F7D58"/>' +
        '<path d="M50 44c11-3 14-13 14-13s-11-3-17 6z" fill="#4E9269"/>' +
        svgClose;
    }
    if (stage === "arvore") {
      return svgOpen + potPath +
        '<path d="M50 70V30" stroke="#5C4326" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="50" cy="26" r="22" fill="#4E9269"/>' +
        '<circle cx="34" cy="38" r="14" fill="#3F7D58"/>' +
        '<circle cx="66" cy="38" r="14" fill="#3F7D58"/>' +
        svgClose;
    }
    // especial
    return svgOpen + potPath +
      '<path d="M50 70V30" stroke="#5C4326" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="50" cy="26" r="22" fill="#4E9269"/>' +
      '<circle cx="34" cy="38" r="14" fill="#3F7D58"/>' +
      '<circle cx="66" cy="38" r="14" fill="#3F7D58"/>' +
      '<circle cx="38" cy="20" r="4.5" fill="#DE9F2E"/>' +
      '<circle cx="58" cy="14" r="4.5" fill="#D9694E"/>' +
      '<circle cx="68" cy="28" r="4.5" fill="#DE9F2E"/>' +
      '<circle cx="46" cy="34" r="4.5" fill="#D9694E"/>' +
      svgClose;
  }

  function checkSvg() {
    return '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // ---------------- RENDERIZAÇÃO ----------------

  function renderAll() {
    var tk = todayKey();
    var day = ensureDay(tk);

    renderGreeting();
    renderCharacter();
    renderMissions(day);
    renderQuickStats(day);
    renderHabitos(day);
    renderProgresso();
    renderBemEstar(day);
    renderConquistas();
    renderPerfil();
    if (window.MDS && window.MDS.onChange) window.MDS.onChange();
  }

  function avatarInnerHtml() {
    if (state.profile && state.profile.photoData) {
      return '<img src="' + state.profile.photoData + '" alt="Foto de perfil">';
    }
    var n = state.profile && state.profile.name ? state.profile.name.trim() : "";
    return n ? n.charAt(0).toUpperCase() : "Eu";
  }

  function renderPerfil() {
    var p = state.profile || { name: "", birthdate: "", photoData: null };

    document.getElementById("miniAvatarSidebar").innerHTML = avatarInnerHtml();
    document.getElementById("miniAvatarMobile").innerHTML = avatarInnerHtml();
    document.getElementById("sidebarProfileName").textContent = p.name && p.name.trim() ? p.name.trim().split(" ")[0] : "Meu perfil";

    var nameInput = document.getElementById("profileName");
    var birthInput = document.getElementById("profileBirthdate");
    if (document.activeElement !== nameInput) nameInput.value = p.name || "";
    if (document.activeElement !== birthInput) birthInput.value = p.birthdate || "";

    document.getElementById("profilePhotoPreview").innerHTML = avatarInnerHtml();
    document.getElementById("profileAge").textContent = ageText(p.birthdate);
  }

  function ageText(birthdate) {
    if (!birthdate) return "";
    var b = new Date(birthdate + "T12:00:00");
    if (isNaN(b.getTime())) return "";
    var today = new Date();
    var age = today.getFullYear() - b.getFullYear();
    var m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    if (age < 0) return "";
    return age + " ano" + (age === 1 ? "" : "s");
  }

  function renderGreeting() {
    var hour = new Date().getHours();
    var greet = hour < 12 ? "Bom dia" : (hour < 18 ? "Boa tarde" : "Boa noite");
    var name = (state.profile && state.profile.name) ? state.profile.name.trim().split(" ")[0] : "";
    document.getElementById("greeting").textContent = greet + (name ? ", " + name : "") + "!";
    var d = new Date();
    var opts = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById("todayLabel").textContent =
      d.toLocaleDateString('pt-BR', opts).replace(/^\w/, function (c) { return c.toUpperCase(); });
  }

  function renderCharacter() {
    var stage = characterStage(state.streak);
    document.getElementById("characterWrap").innerHTML = characterSVG(stage);
    document.getElementById("stageTitle").textContent = STAGE_INFO[stage].title;
    document.getElementById("stageDesc").textContent = STAGE_INFO[stage].desc;
    document.getElementById("streakCount").textContent = state.streak;
  }

  function renderMissions(day) {
    var m = missionStatus(day);
    var count = missionCount(m);
    document.getElementById("missionProgressText").textContent = count + " de " + missionTotal();

    var items = [
      { key: "water", label: "Beber água", sub: day.water + "/" + WATER_TARGET + " copos", done: m.water },
      { key: "pause", label: "Fazer uma pausa", sub: day.pauseCount + " pausa(s) hoje", done: m.pause },
      { key: "moved", label: "Caminhar um pouco", sub: m.moved ? "Movimento registrado" : "Ainda não registrado", done: m.moved },
      { key: "sleep", label: "Ter uma boa noite de sono", sub: day.sleepStart && day.sleepEnd ? sleepHoursText(day) : "Registre os horários de sono", done: m.sleep }
    ];

    var html = "";
    items.filter(function (it) { return state.settings.missions[it.key]; }).forEach(function (it) {
      html += '<li class="mission-item ' + (it.done ? "done" : "") + '" data-mission="' + it.key + '" role="button" tabindex="0">' +
        '<div class="mission-check">' + checkSvg() + '</div>' +
        '<div><div class="mission-label">' + it.label + '</div><div class="mission-sub">' + it.sub + '</div></div>' +
        '</li>';
    });
    document.getElementById("missionList").innerHTML = html;

    document.querySelectorAll(".mission-item").forEach(function (el) {
      el.addEventListener("click", function () {
        var key = el.getAttribute("data-mission");
        goToRelevantHabit(key);
      });
    });

    maybeMarkStreak(day, count);
  }

  function goToRelevantHabit(key) {
    switchPage("habitos");
    var map = { water: "waterPlus", pause: "pausePlus", moved: "moveToggle", sleep: "sleepStart" };
    var el = document.getElementById(map[key]);
    if (el) { el.focus(); }
  }

  function maybeMarkStreak(day, count) {
    if (count >= missionTotal() && !day.streakCounted) {
      day.streakCounted = true;
      state.streak += 1;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      state.fullDaysEver += 1;
      state.points += 20;
      persist();
    }
  }

  function renderQuickStats(day) {
    var moodInfo = MOODS.find(function (x) { return x.id === day.mood; });
    var html = "";
    html += statChip(day.water + " copos", "Água hoje");
    html += statChip(day.sleepStart && day.sleepEnd ? sleepHoursShort(day) : "—", "Sono");
    html += statChip(moodInfo ? moodInfo.emoji + " " + moodInfo.label : "—", "Humor");
    html += statChip(state.points, "Pontos totais");
    document.getElementById("quickStats").innerHTML = html;
  }

  function sleepHoursShort(day) {
    return (Math.round(sleepMinutes(day) / 6) / 10) + "h";
  }

  function statChip(value, label) {
    return '<div class="stat-chip"><div class="num">' + value + '</div><div class="lbl">' + label + '</div></div>';
  }

  function renderHabitos(day) {
    document.getElementById("waterValue").textContent = day.water;
    document.getElementById("waterValue").closest(".habit-card").querySelector(".habit-desc").textContent = "Meta de hoje: " + WATER_TARGET + " copos";
    var cupsHtml = "";
    for (var i = 0; i < WATER_TARGET; i++) {
      cupsHtml += '<div class="cup ' + (i < day.water ? "filled" : "") + '"></div>';
    }
    document.getElementById("cupsRow").innerHTML = cupsHtml;

    document.getElementById("sleepStart").value = day.sleepStart || "";
    document.getElementById("sleepEnd").value = day.sleepEnd || "";
    document.getElementById("sleepSummary").textContent = sleepHoursText(day);

    var moveBtn = document.getElementById("moveToggle");
    moveBtn.textContent = day.moved ? "Movimento feito hoje ✓" : "Ainda não me movimentei hoje";
    moveBtn.classList.toggle("on", day.moved);

    document.getElementById("mealChecklist").innerHTML = MEAL_ITEMS.map(function (item) {
      var done = day.meals[item.id];
      return '<div class="check-row ' + (done ? "done" : "") + '" data-meal="' + item.id + '" role="checkbox" tabindex="0" aria-checked="' + !!done + '">' +
        '<div class="mini-check">' + checkSvg() + '</div><span class="check-label">' + item.label + '</span></div>';
    }).join("");

    document.getElementById("pauseValue").textContent = day.pauseCount;

    document.getElementById("petChecklist").innerHTML = PET_ITEMS.map(function (item) {
      var done = day.pet[item.id];
      return '<div class="check-row ' + (done ? "done" : "") + '" data-pet="' + item.id + '" role="checkbox" tabindex="0" aria-checked="' + !!done + '">' +
        '<div class="mini-check">' + checkSvg() + '</div><span class="check-label">' + item.label + '</span></div>';
    }).join("");

    var tipIndex = new Date().getDate() % FOOD_TIPS.length;
    document.getElementById("foodTip").textContent = FOOD_TIPS[tipIndex];
  }

  function renderProgresso() {
    document.getElementById("progStreak").textContent = state.streak;
    document.getElementById("progPoints").textContent = state.points;
    document.getElementById("progBest").textContent = state.bestStreak;

    renderTodayRing();
    renderWeekBars();
    renderHabitSummary();
    renderHeatmap();
  }

  function renderTodayRing() {
    var day = ensureDay(todayKey());
    var m = missionStatus(day);
    var count = missionCount(m);
    var pct = count / missionTotal() * 100;
    var circumference = 2 * Math.PI * 50;
    var offset = circumference * (1 - pct / 100);
    var ring = document.getElementById("ringFill");
    ring.style.strokeDasharray = circumference.toFixed(2);
    ring.style.strokeDashoffset = offset.toFixed(2);
    document.getElementById("ringPct").textContent = Math.round(pct) + "%";
    document.getElementById("ringCaption").textContent = count + " de " + missionTotal() + " missões hoje";
  }

  function renderWeekBars() {
    var dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    var tk = todayKey();
    var html = "";
    for (var i = 6; i >= 0; i--) {
      var key = dateKeyOffset(-i);
      var d = state.days[key] || defaultDay();
      var m = missionStatus(d);
      var pct = (missionCount(m) / missionTotal()) * 100;
      var dow = new Date(key + "T12:00:00").getDay();
      html += '<div class="bar-col ' + (key === tk ? "is-today" : "") + '">' +
        '<div class="bar-track"><div class="bar-fill" style="height:' + pct + '%;"></div></div>' +
        '<div class="bar-day">' + dayNames[dow] + '</div>' +
        '</div>';
    }
    document.getElementById("weekBars").innerHTML = html;
  }

  function weeklyAverages() {
    var totalWater = 0, totalSleepMin = 0, sleepDays = 0, movedDays = 0, totalPauses = 0;
    for (var i = 6; i >= 0; i--) {
      var key = dateKeyOffset(-i);
      var d = state.days[key] || defaultDay();
      totalWater += d.water || 0;
      var mins = sleepMinutes(d);
      if (mins) { totalSleepMin += mins; sleepDays++; }
      if (d.moved) movedDays++;
      totalPauses += d.pauseCount || 0;
    }
    return {
      avgWater: (totalWater / 7).toFixed(1),
      avgSleep: sleepDays ? (totalSleepMin / sleepDays / 60).toFixed(1) + "h" : "—",
      movedDays: movedDays,
      totalPauses: totalPauses
    };
  }

  function renderHabitSummary() {
    var a = weeklyAverages();
    var items = [
      { icon: "💧", val: a.avgWater, lbl: "copos de água / dia" },
      { icon: "😴", val: a.avgSleep, lbl: "de sono médio" },
      { icon: "🏃", val: a.movedDays + "/7", lbl: "dias em movimento" },
      { icon: "⏰", val: a.totalPauses, lbl: "pausas na semana" }
    ];
    document.getElementById("habitSummaryGrid").innerHTML = items.map(function (it) {
      return '<div class="habit-summary-card">' +
        '<div class="hs-icon">' + it.icon + '</div>' +
        '<div class="hs-val">' + it.val + '</div>' +
        '<div class="hs-lbl">' + it.lbl + '</div>' +
        '</div>';
    }).join("");
  }

  function renderHeatmap() {
    var html = "";
    for (var i = 34; i >= 0; i--) {
      var key = dateKeyOffset(-i);
      var d = state.days[key] || defaultDay();
      var m = missionStatus(d);
      var level = Math.round(missionCount(m) / missionTotal() * 4);
      var dateObj = new Date(key + "T12:00:00");
      var label = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
      html += '<div class="hm-cell l' + level + '" title="' + label + ': ' + missionCount(m) + '/' + missionTotal() + ' missões"></div>';
    }
    document.getElementById("heatmapGrid").innerHTML = html;
  }

  function renderBemEstar(day) {
    document.getElementById("moodRow").innerHTML = MOODS.map(function (m) {
      return '<button class="mood-btn ' + (day.mood === m.id ? "selected" : "") + '" data-mood="' + m.id + '" aria-pressed="' + (day.mood === m.id) + '" aria-label="' + m.label + '">' +
        m.emoji + '<span class="mood-word">' + m.label + '</span></button>';
    }).join("");

    var tipsHtml = "";
    PAUSE_TIPS.forEach(function (t) {
      tipsHtml += '<div class="tip-row"><span>' + t.icon + '</span><span>' + t.text + '</span></div>';
    });
    document.getElementById("tipsList").innerHTML = tipsHtml;
  }

  function renderConquistas() {
    var snapshot = {
      streak: state.streak,
      totalMissionsEver: state.totalMissionsEver,
      fullDaysEver: state.fullDaysEver,
      points: state.points, waterDays: 0, sleepDays: 0, moveDays: 0, moodDays: 0, petDays: 0,
      notesCount: Object.keys(state.notes || {}).length
    };
    Object.keys(state.days).forEach(function (k) {
      var d = state.days[k];
      if (d.water >= WATER_TARGET) snapshot.waterDays++;
      if (sleepMinutes(d) >= 420) snapshot.sleepDays++;
      if (d.moved) snapshot.moveDays++;
      if (d.mood) snapshot.moodDays++;
      if (d.pet && d.pet.fed && d.pet.water && d.pet.walk) snapshot.petDays++;
    });
    var html = "";
    ACHIEVEMENTS.forEach(function (a) {
      var unlocked = a.test(snapshot);
      if (unlocked && state.unlockedAchievements.indexOf(a.id) === -1) {
        state.unlockedAchievements.push(a.id);
        if (window.MDS_toast) window.MDS_toast("🏆 Conquista: " + a.title);
      }
      html += '<div class="badge-card ' + (unlocked ? "" : "locked") + '">' +
        '<div class="badge-icon">' + a.icon + '</div>' +
        '<h3>' + a.title + '</h3>' +
        '<p>' + a.desc + '</p>' +
        '<span class="badge-tag">' + (unlocked ? "Conquistado" : "Bloqueado") + '</span>' +
        '</div>';
    });
    document.getElementById("badgeGrid").innerHTML = html;
  }

  // ---------------- INTERAÇÕES DE UTILIZADOR ----------------

  function switchPage(name) {
    document.querySelectorAll(".page").forEach(function (p) { p.classList.remove("active"); });
    var target = document.getElementById("page-" + name);
    if (target) target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-page") === name);
    });
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function bindNav() {
    document.querySelectorAll(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var page = btn.getAttribute("data-page");
        if (page) switchPage(page);
      });
    });
  }

  function bindHabitEvents() {
    var tk = function () { return todayKey(); };

    document.getElementById("waterPlus").addEventListener("click", function () {
      var day = ensureDay(tk());
      if (day.water < 12) {
        day.water++;
        award(day, "w" + day.water, 2, false);
        if (day.water >= WATER_TARGET) award(day, "water", 0, true);
      }
      afterChange();
    });

    document.getElementById("waterMinus").addEventListener("click", function () {
      var day = ensureDay(tk());
      if (day.water > 0) { day.water--; }
      afterChange();
    });

    document.getElementById("sleepStart").addEventListener("change", function (e) {
      var day = ensureDay(tk());
      day.sleepStart = e.target.value;
      finalizeSleep(day);
    });

    document.getElementById("sleepEnd").addEventListener("change", function (e) {
      var day = ensureDay(tk());
      day.sleepEnd = e.target.value;
      finalizeSleep(day);
    });

    function finalizeSleep(day) {
      if (day.sleepStart && day.sleepEnd) award(day, "sleep", 10, true);
      afterChange();
    }

    document.getElementById("moveToggle").addEventListener("click", function () {
      var day = ensureDay(tk());
      day.moved = !day.moved;
      if (day.moved) award(day, "moved", 5, true);
      afterChange();
    });

    document.getElementById("pausePlus").addEventListener("click", function () {
      var day = ensureDay(tk());
      var before = day.pauseCount;
      day.pauseCount++;
      if (before === 0) award(day, "pause", 5, true);
      afterChange();
    });

    document.getElementById("pauseMinus").addEventListener("click", function () {
      var day = ensureDay(tk());
      if (day.pauseCount > 0) day.pauseCount--;
      afterChange();
    });

    document.getElementById("mealChecklist").addEventListener("click", function (e) {
      var row = e.target.closest("[data-meal]");
      if (!row) return;
      var day = ensureDay(tk());
      var id = row.getAttribute("data-meal");
      day.meals[id] = !day.meals[id];
      if (day.meals[id]) award(day, "meal-" + id, 3, false);
      afterChange();
    });

    document.getElementById("petChecklist").addEventListener("click", function (e) {
      var row = e.target.closest("[data-pet]");
      if (!row) return;
      var day = ensureDay(tk());
      var id = row.getAttribute("data-pet");
      day.pet[id] = !day.pet[id];
      if (day.pet[id]) award(day, "pet-" + id, 3, false);
      afterChange();
    });

    document.getElementById("moodRow").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-mood]");
      if (!btn) return;
      var day = ensureDay(tk());
      day.mood = btn.getAttribute("data-mood");
      award(day, "mood", 3, false);
      afterChange();
    });
  }

  function afterChange() {
    renderAll();
    persist();
  }

  // Exemplo de Respiração Guiada
  function bindBreathing() {
    var circle = document.getElementById("breathCircle");
    var btn = document.getElementById("breathBtn");
    var running = false;
    var timer = null;
    var phaseIdx = 0;
    var phases = [
      { cls: "inhale", label: "Inspire", ms: 4000 },
      { cls: "hold", label: "Segure", ms: 4000 },
      { cls: "exhale", label: "Expire", ms: 6000 }
    ];

    function runPhase() {
      var p = phases[phaseIdx % phases.length];
      circle.className = "breath-circle " + p.cls;
      circle.textContent = p.label;
      timer = setTimeout(function () {
        phaseIdx++;
        if (running) runPhase();
      }, p.ms);
    }

    btn.addEventListener("click", function () {
      running = !running;
      btn.classList.toggle("active", running);
      if (running) {
        btn.textContent = "Parar";
        phaseIdx = 0;
        runPhase();
      } else {
        btn.textContent = "Começar respiração guiada";
        clearTimeout(timer);
        circle.className = "breath-circle";
        circle.textContent = "Pronto";
      }
    });
  }

  function resizeImageFile(file, maxSize, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        var scale = Math.min(1, maxSize / Math.max(w, h));
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function bindPerfil() {
    document.getElementById("photoEditBtn").addEventListener("click", function () {
      document.getElementById("photoInput").click();
    });

    document.getElementById("photoInput").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      resizeImageFile(file, 240, function (dataUrl) {
        state.profile.photoData = dataUrl;
        renderPerfil();
        persist();
      });
      e.target.value = "";
    });

    document.getElementById("removePhotoBtn").addEventListener("click", function () {
      state.profile.photoData = null;
      renderPerfil();
      persist();
    });

    document.getElementById("saveProfileBtn").addEventListener("click", function () {
      state.profile.name = document.getElementById("profileName").value;
      state.profile.birthdate = document.getElementById("profileBirthdate").value;
      persist();
      renderAll();
      var confirmEl = document.getElementById("saveConfirm");
      confirmEl.classList.add("show");
      setTimeout(function () { confirmEl.classList.remove("show"); }, 2200);
    });

    document.getElementById("miniAvatarMobile").addEventListener("click", function () {
      switchPage("perfil");
    });
  }

  function bindReset() {
    document.getElementById("resetBtn").addEventListener("click", function () {
      var sure = confirm("Isso vai apagar todo o seu progresso salvo neste app. Deseja continuar?");
      if (!sure) return;
      state = defaultState();
      applySettings();
      handleDayRollover();
      persist();
      renderAll();
    });
  }

  var MOOD_EMO = {};
  MOODS.forEach(function (m) { MOOD_EMO[m.id] = m.emoji; });

  function init() {
    loadState();
    bindNav();
    bindHabitEvents();
    bindBreathing();
    bindPerfil();
    bindReset();
    renderAll();
    window.MDS = {
      state: function () { return state; },
      day: function () { return ensureDay(todayKey()); },
      key: dateKeyOffset,
      score: function (d) { return missionCount(missionStatus(d)); },
      commit: afterChange,
      goto: switchPage,
      award: award,
      total: missionTotal,
      goal: function () { return WATER_TARGET; },
      apply: applySettings,
      active: activeKeys,
      sleep: sleepMinutes,
      store: STORAGE_KEY,
      profiles: P,
      pad: pad,
      emoji: MOOD_EMO,
      $: function (s) { return document.querySelector(s); },
      make: function (tag, cls, html) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
      }
    };
  }

  init();
})();

/* Meu Dia Saudável — camada de extras (10 novidades) */
(function () {
  "use strict";
  var M = window.MDS;
  if (!M) return;

  var KEY = "mds-extras";
  var X = { theme: null, remind: { on: false, min: 60 } };
  try { X = Object.assign(X, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  function saveX() { try { localStorage.setItem(KEY, JSON.stringify(X)); } catch (e) {} }
  var $ = M.$, make = M.make, pad = M.pad;

  /* 1. TEMA ESCURO */
  function theme() {
    return X.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  var SVG = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' aria-hidden='true'>";
  var ICON_SUN = SVG + "<circle cx='12' cy='12' r='4'/><path d='M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4'/></svg>";
  var ICON_MOON = SVG + "<path d='M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z'/></svg>";
  function applyTheme() {
    document.documentElement.setAttribute("data-theme", theme());
    document.querySelectorAll(".x-theme-btn").forEach(function (b) {
      b.innerHTML = theme() === "dark" ? ICON_SUN : ICON_MOON;
      b.title = theme() === "dark" ? "Tema claro" : "Tema escuro";
    });
  }
  function themeBtn() {
    var b = make("button", "x-theme-btn");
    b.type = "button";
    b.setAttribute("aria-label", "Alternar tema");
    b.addEventListener("click", function () {
      X.theme = theme() === "dark" ? "light" : "dark";
      saveX(); applyTheme();
    });
    return b;
  }

  /* 2. TOASTS e 3. CONFETE */
  var tw = make("div", "x-toasts");
  tw.setAttribute("aria-live", "polite");
  document.body.appendChild(tw);
  function toast(t) {
    var e = make("div", "x-toast", t);
    tw.appendChild(e);
    setTimeout(function () {
      e.classList.add("out");
      setTimeout(function () { e.remove(); }, 300);
    }, 2300);
  }
  window.MDS_toast = toast;
  function confetti() {
    var cols = ["#1F6B47", "#D99A1E", "#C4553B", "#3A6EA5"], w = make("div", "x-confetti");
    for (var i = 0; i < 48; i++) {
      var p = make("i");
      p.style.cssText = "left:" + Math.random() * 100 + "%;background:" + cols[i % 4] +
        ";animation-delay:" + (Math.random() * 0.4) + "s;--dx:" + (Math.random() * 160 - 80) + "px";
      w.appendChild(p);
    }
    document.body.appendChild(w);
    setTimeout(function () { w.remove(); }, 2800);
    if (navigator.vibrate) navigator.vibrate(60);
  }

  /* 4. FRASE DO DIA */
  var QUOTES = [
    "Pequenos passos todos os dias levam longe.",
    "Cuidar de você não é luxo, é base.",
    "Hoje basta o próximo gesto gentil com o seu corpo.",
    "Constância vale mais que perfeição.",
    "Um copo d'água agora já é uma vitória.",
    "Descansar também é produtivo.",
    "Seu ritmo é o ritmo certo."
  ];

  /* 5. NÍVEIS / XP */
  var TITLES = ["Semente", "Raiz", "Broto", "Folha", "Galho", "Árvore", "Floresta", "Guardião"];
  function level(p) {
    var l = Math.floor(Math.sqrt(p / 25)) + 1, base = 25 * (l - 1) * (l - 1), next = 25 * l * l;
    return { l: l, pct: (p - base) / (next - base) * 100, next: next, title: TITLES[Math.min(l - 1, TITLES.length - 1)] };
  }

  var MOOD_EMO = M.emoji;

  function sleepH(d) { var m = M.sleep(d); return m ? m / 60 : null; }

  /* ---------- Construção dos blocos ---------- */
  var el = {};
  function build() {
    // tema (sidebar + topbar mobile)
    var foot = $(".sidebar-foot");
    if (foot) foot.insertBefore(themeBtn(), foot.firstChild);
    var top = $(".mobile-topbar"), av = $("#miniAvatarMobile");
    if (top && av) top.insertBefore(themeBtn(), av);

    // frase do dia
    var hero = $(".home-hero");
    el.quote = make("div", "x-quote");
    if (hero) hero.parentNode.insertBefore(el.quote, hero.nextSibling);

    // nível
    el.level = make("div", "x-level");
    var ht = $(".hero-text");
    if (ht) ht.appendChild(el.level);

    var be = $("#page-bemestar"), pr = $("#page-progresso"), pf = $("#page-perfil");

    // humor últimos 14 dias
    el.mood = make("div", "card x-card");
    el.mood.innerHTML = "<h3>Seu humor nos últimos 14 dias</h3><div class='x-moodstrip' id='xMoodStrip'></div>";
    be.appendChild(el.mood);

    // foco / pomodoro
    var f = make("div", "card x-card");
    f.innerHTML = "<h3>Foco com pausa</h3><p class='x-sub'>Ao terminar o foco, uma pausa é registrada nos seus hábitos.</p>" +
      "<div class='x-timer' id='xTime'>25:00</div>" +
      "<div class='x-row'><select id='xFocusMin' aria-label='Duração do foco'><option value='15'>15 min</option><option value='25' selected>25 min</option><option value='45'>45 min</option></select>" +
      "<button class='x-btn' id='xFocusBtn' type='button'>Iniciar foco</button></div>";
    be.appendChild(f);

    // lembrete de água
    var r = make("div", "card x-card");
    r.innerHTML = "<h3>Lembrete de água 💧</h3><p class='x-sub'>Funciona enquanto o app estiver aberto.</p>" +
      "<div class='x-row'><select id='xRemMin' aria-label='Intervalo do lembrete'><option value='30'>a cada 30 min</option><option value='60'>a cada 1 h</option><option value='90'>a cada 1h30</option></select>" +
      "<button class='x-btn' id='xRemBtn' type='button'></button></div>";
    be.appendChild(r);

    // insights
    el.ins = make("div", "card x-card");
    el.ins.innerHTML = "<h3>Seus padrões</h3><ul class='x-ins' id='xIns'></ul>";
    var sec = pr.querySelectorAll(".section-title")[0];
    pr.insertBefore(el.ins, sec);

    // backup
    var b = make("div", "x-backup");
    b.innerHTML = "<h3>Backup dos dados</h3><p class='x-sub'>Baixe uma cópia ou restaure em outro aparelho.</p>" +
      "<div class='x-row'><button class='x-btn' id='xExp' type='button'>Exportar</button>" +
      "<button class='x-btn ghost' id='xImp' type='button'>Importar</button><input type='file' id='xFile' accept='application/json' hidden></div>";
    pf.querySelector(".card").appendChild(b);

    bindFocus(); bindReminder(); bindBackup();
  }

  /* ---------- Foco ---------- */
  var focus = { end: 0, timer: null };
  function bindFocus() {
    var btn = $("#xFocusBtn"), time = $("#xTime"), sel = $("#xFocusMin");
    function show(sec) { time.textContent = pad(Math.floor(sec / 60)) + ":" + pad(sec % 60); }
    sel.addEventListener("change", function () { if (!focus.timer) show(+sel.value * 60); });
    function stop() {
      clearInterval(focus.timer); focus.timer = null;
      btn.textContent = "Iniciar foco"; sel.disabled = false;
      show(+sel.value * 60);
    }
    btn.addEventListener("click", function () {
      if (focus.timer) { stop(); return; }
      focus.end = Date.now() + sel.value * 60000;
      sel.disabled = true; btn.textContent = "Parar";
      focus.timer = setInterval(function () {
        var left = Math.round((focus.end - Date.now()) / 1000);
        if (left <= 0) {
          stop();
          var d = M.day(), before = d.pauseCount;
          d.pauseCount++;
          if (before === 0) M.award(d, "pause", 5, true);
          M.commit();
          toast("Foco concluído! Hora de uma pausa 🌿");
          if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
        } else show(left);
      }, 500);
    });
  }

  /* ---------- Lembrete de água ---------- */
  var remTimer = null;
  function bindReminder() {
    var btn = $("#xRemBtn"), sel = $("#xRemMin");
    sel.value = X.remind.min;
    function paint() { btn.textContent = X.remind.on ? "Desativar" : "Ativar"; btn.classList.toggle("ghost", X.remind.on); }
    function schedule() {
      clearInterval(remTimer); remTimer = null;
      if (!X.remind.on) return;
      remTimer = setInterval(function () {
        var d = M.day();
        if (d.water >= M.goal()) return;
        var msg = "Hora de beber água 💧 (" + d.water + "/" + M.goal() + " copos)";
        if ("Notification" in window && Notification.permission === "granted") new Notification("Meu Dia Saudável", { body: msg });
        else toast(msg);
      }, X.remind.min * 60000);
    }
    btn.addEventListener("click", function () {
      X.remind.on = !X.remind.on;
      if (X.remind.on && "Notification" in window && Notification.permission === "default") Notification.requestPermission();
      saveX(); paint(); schedule();
    });
    sel.addEventListener("change", function () { X.remind.min = +sel.value; saveX(); schedule(); });
    paint(); schedule();
  }

  /* ---------- Backup ---------- */
  function bindBackup() {
    $("#xExp").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(M.state())], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "meu-dia-saudavel-" + M.key(0) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $("#xImp").addEventListener("click", function () { $("#xFile").click(); });
    $("#xFile").addEventListener("change", function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var o = JSON.parse(rd.result);
          if (!o || typeof o.days !== "object") throw new Error("inválido");
          if (!confirm("Isso substitui os dados atuais pelos do backup. Continuar?")) return;
          localStorage.setItem(M.store, JSON.stringify(o));
          location.reload();
        } catch (err) { toast("Arquivo de backup inválido"); }
      };
      rd.readAsText(f);
      e.target.value = "";
    });
  }

  /* ---------- Atualização reativa ---------- */
  var lastPts = null, lastLvl = null, lastDone = null;
  function insights() {
    var s = M.state(), names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    var tot = [0, 0, 0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0, 0, 0], active = 0, waterOk = 0;
    var longW = [], shortW = [], moods = {};
    for (var i = 0; i < 28; i++) {
      var k = M.key(-i), d = s.days[k];
      if (!d) continue;
      var c = M.score(d);
      if (c === 0 && !d.water && !d.mood) continue;
      active++;
      var dow = new Date(k + "T12:00:00").getDay();
      tot[dow] += c; cnt[dow]++;
      if (i < 14) {
        if (d.water >= M.goal()) waterOk++;
        if (d.mood) moods[d.mood] = (moods[d.mood] || 0) + 1;
      }
      var h = sleepH(d);
      if (h != null) (h >= 7 ? longW : shortW).push(d.water || 0);
    }
    var out = [];
    if (active < 3) return ["Registre alguns dias e eu mostro seus padrões aqui."];
    var best = -1, bestAvg = -1;
    for (var j = 0; j < 7; j++) if (cnt[j] && tot[j] / cnt[j] > bestAvg) { bestAvg = tot[j] / cnt[j]; best = j; }
    if (best >= 0) out.push("📅 Seu melhor dia costuma ser <b>" + names[best] + "</b> (média " + bestAvg.toFixed(1) + "/" + M.total() + " missões).");
    out.push("💧 Meta de água batida em <b>" + waterOk + "</b> dos últimos 14 dias.");
    if (longW.length && shortW.length) {
      var avg = function (a) { return (a.reduce(function (x, y) { return x + y; }, 0) / a.length).toFixed(1); };
      out.push("😴 Com 7h+ de sono você bebe <b>" + avg(longW) + "</b> copos; com menos, <b>" + avg(shortW) + "</b>.");
    }
    var top = Object.keys(moods).sort(function (a, b) { return moods[b] - moods[a]; })[0];
    if (top) out.push("🧠 Humor mais frequente: <b>" + MOOD_EMO[top] + "</b>.");
    return out;
  }

  function update() {
    var s = M.state(), d = M.day();

    // frase do dia
    var n = new Date(); n = n.getFullYear() * 400 + n.getMonth() * 31 + n.getDate();
    el.quote.textContent = "“" + QUOTES[n % QUOTES.length] + "”";

    // nível + toast de pontos
    var L = level(s.points);
    el.level.innerHTML = "<div class='x-lvl-top'><b>Nível " + L.l + " · " + L.title + "</b><span>" + s.points + "/" + L.next + " ⭐</span></div>" +
      "<div class='x-lvl-bar'><div style='width:" + Math.max(0, Math.min(100, L.pct)) + "%'></div></div>";
    if (lastPts !== null) {
      if (s.points > lastPts) toast("+" + (s.points - lastPts) + " ⭐");
      if (lastLvl !== null && L.l > lastLvl) { toast("Subiu para o nível " + L.l + "! 🌳"); confetti(); }
    }
    lastPts = s.points; lastLvl = L.l;

    // confete ao completar o dia
    if (lastDone === false && d.streakCounted) { confetti(); toast("Todas as missões de hoje! 🎉"); }
    lastDone = !!d.streakCounted;

    // faixa de humor
    var html = "";
    for (var i = 13; i >= 0; i--) {
      var day = s.days[M.key(-i)];
      var m = day && day.mood;
      html += "<span class='x-mood" + (m ? "" : " empty") + "' title='" + M.key(-i) + "'>" + (m ? MOOD_EMO[m] : "·") + "</span>";
    }
    $("#xMoodStrip").innerHTML = html;

    // insights
    $("#xIns").innerHTML = insights().map(function (t) { return "<li>" + t + "</li>"; }).join("");
  }

  applyTheme();
  build();
  applyTheme();
  M.onChange = update;
  M.level = level;
  update();
})();

/* Meu Dia Saudável — extras 2 (mais 8 novidades) */
(function () {
  "use strict";
  var M = window.MDS;
  if (!M) return;

  var $ = M.$, make = M.make, pad = M.pad;
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var toast = window.MDS_toast;
  var MOOD = M.emoji;
  function sleepH(d) { var m = M.sleep(d); return m ? Math.round(m / 6) / 10 : null; }
  function notes() { var s = M.state(); if (!s.notes) s.notes = {}; return s.notes; }

  var el = {};

  /* ---------- Construção ---------- */
  function build() {
    var home = $("#page-home"), hab = $("#page-habitos"), pro = $("#page-progresso"), be = $("#page-bemestar");

    // 1. Desafio da semana + 2. Compartilhar (Início)
    el.chal = make("div", "card x-card");
    home.appendChild(el.chal);
    var sh = make("button", "x-btn ghost x-share", "Compartilhar meu dia");
    sh.type = "button";
    sh.addEventListener("click", share);
    home.appendChild(sh);

    // 3. Ideias de lanche (Hábitos)
    var sn = make("div", "card x-card");
    sn.innerHTML = "<h3>Ideia de lanche saudável</h3><p class='x-sub' id='xSnack'>Toque no botão para uma sugestão.</p>" +
      "<button class='x-btn' id='xSnackBtn' type='button'>Sugerir outra</button>";
    hab.appendChild(sn);

    // 4. Calendário mensal (Progresso)
    el.cal = make("div", "card x-card");
    el.cal.innerHTML = "<div class='x-cal-head'><button class='x-nav' id='xPrev' aria-label='Mês anterior'>‹</button><h3 id='xMonth'></h3>" +
      "<button class='x-nav' id='xNext' aria-label='Próximo mês'>›</button></div>" +
      "<div class='x-cal' id='xCal'></div><div class='x-sub' id='xCalInfo' aria-live='polite'>Toque em um dia para ver os detalhes.</div>";
    pro.appendChild(el.cal);

    // 5. Diário de gratidão (Bem-estar)
    var g = make("div", "card x-card");
    g.innerHTML = "<h3>Diário de gratidão</h3><p class='x-sub'>Escreva uma coisa boa de hoje.</p>" +
      "<textarea id='xGrat' rows='2' maxlength='200' placeholder='Hoje sou grato por...'></textarea>" +
      "<div class='x-row'><button class='x-btn' id='xGratSave' type='button'>Salvar</button></div><ul class='x-ins' id='xGratList'></ul>";
    be.appendChild(g);

    // 6. Sons relaxantes
    var n = make("div", "card x-card");
    n.innerHTML = "<h3>Sons relaxantes</h3><p class='x-sub'>Gerados no seu aparelho, sem baixar nada.</p>" +
      "<div class='x-row'><button class='x-btn ghost' data-noise='rain' type='button'>🌧️ Chuva</button>" +
      "<button class='x-btn ghost' data-noise='wind' type='button'>🌬️ Vento</button></div>";
    be.appendChild(n);

    // 7. Alongamento guiado
    var st = make("div", "card x-card");
    st.innerHTML = "<h3>Alongamento guiado</h3><p class='x-sub'>5 movimentos de 30 segundos. Conta como movimento do dia.</p>" +
      "<div class='x-stretch' id='xStretch'>Pronto para começar?</div>" +
      "<div class='x-row'><button class='x-btn' id='xStretchBtn' type='button'>Começar</button></div>";
    be.appendChild(st);

    bindSnack(); bindCal(); bindGrat(); bindNoise(); bindStretch(); bindKeys();
  }

  /* ---------- 1. Desafio da semana ---------- */
  var CHALLENGES = [
    { t: "Semana da hidratação", d: "Bata a meta de água em 5 dos últimos 7 dias.", goal: 5, f: function (d) { return d.water >= M.goal() ? 1 : 0; } },
    { t: "Semana em movimento", d: "Movimente-se em 4 dos últimos 7 dias.", goal: 4, f: function (d) { return d.moved ? 1 : 0; } },
    { t: "Semana das pausas", d: "Faça 10 pausas nos últimos 7 dias.", goal: 10, f: function (d) { return d.pauseCount || 0; } },
    { t: "Semana do autoconhecimento", d: "Registre seu humor em 5 dos últimos 7 dias.", goal: 5, f: function (d) { return d.mood ? 1 : 0; } }
  ];
  function renderChallenge() {
    var wk = Math.floor(Date.now() / 604800000), c = CHALLENGES[wk % CHALLENGES.length], v = 0, s = M.state();
    for (var i = 0; i < 7; i++) { var d = s.days[M.key(-i)]; if (d) v += c.f(d); }
    var pct = Math.min(100, v / c.goal * 100), done = v >= c.goal;
    el.chal.innerHTML = "<h3>" + c.t + (done ? " ✅" : "") + "</h3><p class='x-sub'>" + c.d + "</p>" +
      "<div class='x-lvl-bar'><div style='width:" + pct + "%'></div></div>" +
      "<div class='x-sub' style='margin-top:6px'>" + Math.min(v, c.goal) + " de " + c.goal + (done ? " — desafio cumprido! 🎉" : "") + "</div>";
  }

  /* ---------- 2. Compartilhar ---------- */
  function share() {
    var d = M.day(), s = M.state();
    var txt = "Meu dia saudável 🌿\n💧 " + d.water + " copos · 🏃 " + (d.moved ? "me movimentei" : "sem movimento ainda") +
      " · ⏰ " + d.pauseCount + " pausas\n⭐ " + M.score(d) + "/" + M.total() + " missões · 🔥 " + s.streak + " dias seguidos";
    if (navigator.share) { navigator.share({ text: txt }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast("Resumo copiado!"); }, function () { toast("Não consegui copiar"); });
  }

  /* ---------- 3. Lanches ---------- */
  var SNACKS = ["Iogurte natural com frutas", "Maçã com pasta de amendoim", "Mix de castanhas (um punhado)", "Cenoura com homus", "Banana com aveia",
    "Pão integral com queijo branco", "Mamão com sementes de chia", "Ovo cozido com tomate-cereja", "Pipoca simples, sem excesso de sal", "Smoothie de frutas vermelhas"];
  var snackIdx = Math.floor(Math.random() * SNACKS.length);
  function bindSnack() {
    var b = $("#xSnackBtn");
    b.addEventListener("click", function () {
      snackIdx = (snackIdx + 1 + Math.floor(Math.random() * (SNACKS.length - 1))) % SNACKS.length;
      $("#xSnack").textContent = "🍴 " + SNACKS[snackIdx];
    });
  }

  /* ---------- 4. Calendário ---------- */
  var calOff = 0, picked = null;
  function renderCal() {
    var now = new Date(), ref = new Date(now.getFullYear(), now.getMonth() + calOff, 1), y = ref.getFullYear(), m = ref.getMonth();
    $("#xMonth").textContent = ref.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    var first = ref.getDay(), days = new Date(y, m + 1, 0).getDate(), s = M.state(), h = "";
    ["D", "S", "T", "Q", "Q", "S", "S"].forEach(function (w) { h += "<div class='x-wd'>" + w + "</div>"; });
    for (var i = 0; i < first; i++) h += "<div></div>";
    var tk = M.key(0);
    for (var d = 1; d <= days; d++) {
      var k = y + "-" + pad(m + 1) + "-" + pad(d), dd = s.days[k], lv = dd ? Math.round(M.score(dd) / M.total() * 4) : 0, fut = k > tk;
      h += "<button type='button' class='x-day x-l" + lv + (k === tk ? " today" : "") + (k === picked ? " sel" : "") + "' data-k='" + k + "'" + (fut ? " disabled" : "") + ">" + d + "</button>";
    }
    $("#xCal").innerHTML = h;
    $("#xNext").disabled = calOff >= 0;
  }
  function bindCal() {
    $("#xPrev").addEventListener("click", function () { calOff--; renderCal(); });
    $("#xNext").addEventListener("click", function () { if (calOff < 0) { calOff++; renderCal(); } });
    $("#xCal").addEventListener("click", function (e) {
      var b = e.target.closest("[data-k]");
      if (!b) return;
      picked = b.getAttribute("data-k");
      var d = M.state().days[picked], p = picked.split("-"), t = p[2] + "/" + p[1] + ": ";
      if (!d) t += "sem registros.";
      else {
        var sh = sleepH(d);
        t += M.score(d) + "/" + M.total() + " missões · 💧 " + (d.water || 0) + " · 😴 " + (sh == null ? "—" : sh + "h") +
          " · " + (d.moved ? "🏃 sim" : "🏃 não") + " · " + (d.mood ? MOOD[d.mood] : "sem humor");
        var n = notes()[picked];
        if (n) t += " · 📝 " + n;
      }
      $("#xCalInfo").textContent = t;
      renderCal();
    });
  }

  /* ---------- 5. Gratidão ---------- */
  function renderGrat() {
    var n = notes(), ks = Object.keys(n).sort().reverse().slice(0, 3);
    var ta = $("#xGrat");
    if (document.activeElement !== ta && !ta.dataset.dirty) ta.value = n[M.key(0)] || "";
    $("#xGratList").innerHTML = ks.map(function (k) {
      var p = k.split("-");
      return "<li><b>" + p[2] + "/" + p[1] + "</b> — " + esc(n[k]) + "</li>";
    }).join("");
  }
  function bindGrat() {
    var ta = $("#xGrat");
    ta.addEventListener("input", function () { ta.dataset.dirty = "1"; });
    $("#xGratSave").addEventListener("click", function () {
      var v = ta.value.trim(), n = notes(), k = M.key(0);
      if (v) n[k] = v; else delete n[k];
      delete ta.dataset.dirty;
      M.commit();
      toast(v ? "Gratidão salva 🙏" : "Nota removida");
    });
  }

  /* ---------- 6. Sons ---------- */
  var audio = { ctx: null, src: null, kind: null };
  function stopNoise() {
    if (audio.src) { try { audio.src.stop(); } catch (e) {} audio.src.disconnect(); audio.src = null; }
    audio.kind = null;
    document.querySelectorAll("[data-noise]").forEach(function (b) { b.classList.add("ghost"); });
  }
  function bindNoise() {
    document.querySelectorAll("[data-noise]").forEach(function (b) {
      b.addEventListener("click", function () {
        var kind = b.getAttribute("data-noise"), was = audio.kind;
        stopNoise();
        if (was === kind) return;
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { toast("Seu navegador não suporta áudio"); return; }
        audio.ctx = audio.ctx || new AC();
        var c = audio.ctx, len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0), last = 0;
        for (var i = 0; i < len; i++) {
          var w = Math.random() * 2 - 1;
          if (kind === "wind") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w * 0.35;
        }
        var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        src.buffer = buf; src.loop = true;
        f.type = kind === "wind" ? "lowpass" : "bandpass";
        f.frequency.value = kind === "wind" ? 600 : 1800;
        g.gain.value = 0.5;
        src.connect(f); f.connect(g); g.connect(c.destination);
        if (c.state === "suspended") c.resume();
        src.start();
        audio.src = src; audio.kind = kind;
        b.classList.remove("ghost");
      });
    });
  }

  /* ---------- 7. Alongamento ---------- */
  var STRETCHES = ["Gire o pescoço devagar para os dois lados.", "Eleve os ombros e solte, em círculos largos.",
    "Entrelace as mãos e estique os braços para cima.", "Incline o tronco para cada lado, sem pressa.", "Alongue as panturrilhas, apoiando-se na parede."];
  var st = { timer: null };
  function bindStretch() {
    var btn = $("#xStretchBtn"), box = $("#xStretch");
    function end(done) {
      clearInterval(st.timer); st.timer = null;
      btn.textContent = "Começar";
      box.textContent = done ? "Muito bem! Alongamento concluído 🌿" : "Pronto para começar?";
      if (done) {
        var d = M.day();
        d.moved = true; M.award(d, "moved", 5, true);
        M.commit();
        toast("Movimento do dia registrado ✓");
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      }
    }
    btn.addEventListener("click", function () {
      if (st.timer) { end(false); return; }
      var i = 0, left = 30;
      btn.textContent = "Parar";
      function paint() { box.innerHTML = "<b>" + (i + 1) + "/5 · " + left + "s</b><br>" + STRETCHES[i]; }
      paint();
      st.timer = setInterval(function () {
        left--;
        if (left <= 0) { i++; left = 30; if (i >= STRETCHES.length) { end(true); return; } }
        paint();
      }, 1000);
    });
  }

  /* ---------- 8. Atalhos de teclado ---------- */
  function bindKeys() {
    var pages = ["home", "habitos", "progresso", "bemestar", "conquistas"];
    document.addEventListener("keydown", function (e) {
      var t = e.target.tagName;
      if (/INPUT|TEXTAREA|SELECT/.test(t) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key >= "1" && e.key <= "5") M.goto(pages[+e.key - 1]);
      else if (e.key === "a") { $("#waterPlus").click(); }
      else if (e.key === "?") toast("Atalhos: 1–5 trocam de aba · A soma 1 copo de água");
    });
  }

  /* ---------- Atualização ---------- */
  function update() {
    renderChallenge(); renderCal(); renderGrat();
  }

  build();
  var prev = M.onChange;
  M.onChange = function () { if (prev) prev(); update(); };
  update();
})();

/* Meu Dia Saudável — extras 3: metas, offline, tendências, peso, rotinas, decoração */
(function () {
  "use strict";
  var M = window.MDS;
  if (!M) return;

  var $ = M.$, make = M.make, pad = M.pad;
  var toast = window.MDS_toast;
  var CHK = "<svg viewBox='0 0 16 16' fill='none'><path d='M3 8.5l3 3 7-7' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/></svg>";
  function row(attr, id, on, label) {
    return "<div class='check-row " + (on ? "done" : "") + "' " + attr + "='" + id + "' role='checkbox' tabindex='0' aria-checked='" + !!on + "'>" +
      "<div class='mini-check'>" + CHK + "</div><span class='check-label'>" + label + "</span></div>";
  }
  function sleepH(d) { var m = M.sleep(d); return m ? m / 60 : null; }

  /* ---------- Modo offline / instalar (PWA) ---------- */
  var deferred = null;
  function pwa() {
    var m = document.createElement("meta");
    m.name = "theme-color"; m.content = "#12382A";
    document.head.appendChild(m);
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault(); deferred = e;
      var b = $("#xInstall"); if (b) b.hidden = false;
    });
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    try {
      var icon = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' fill='#DCEBE1'/><path d='M20 28c0-8-6-11-6-17 0 5 3 6 6 8 3-2 6-3 6-8 0 6-6 9-6 17z' fill='#3F7D58'/></svg>");
      var man = { name: "Meu Dia Saudável", short_name: "Meu Dia", start_url: location.href.split("#")[0], display: "standalone",
        background_color: "#ECEEE7", theme_color: "#12382A", icons: [{ src: icon, sizes: "any", type: "image/svg+xml" }] };
      var l = document.createElement("link");
      l.rel = "manifest";
      l.href = URL.createObjectURL(new Blob([JSON.stringify(man)], { type: "application/manifest+json" }));
      document.head.appendChild(l);
    } catch (e) {}
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  /* ---------- Metas personalizadas (Perfil) ---------- */
  var LBL = { water: "Beber água", sleep: "Registrar o sono", moved: "Movimentar-se", pause: "Fazer uma pausa" };
  var focusKey = null;
  function buildSettings() {
    var c = make("div", "card x-card");
    c.innerHTML = "<h3>Minhas metas</h3><p class='x-sub'>Ajuste o que conta como um bom dia para você.</p>" +
      "<div class='x-set'><span>Meta de água (copos)</span><div class='x-step'>" +
      "<button class='counter-btn' id='xGm' type='button' aria-label='Diminuir meta'>−</button><b id='xGv'></b>" +
      "<button class='counter-btn' id='xGp' type='button' aria-label='Aumentar meta'>+</button></div></div>" +
      "<div class='x-sub' style='margin:14px 0 6px'>Missões do dia</div><div class='checklist' id='xMis'></div>" +
      "<button class='x-btn ghost' id='xInstall' type='button' hidden style='margin-top:14px'>📲 Instalar no celular</button>";
    $("#page-perfil").appendChild(c);
    function goal(delta) {
      var s = M.state().settings;
      s.waterGoal = Math.max(4, Math.min(12, (parseInt(s.waterGoal, 10) || 6) + delta));
      M.apply(); M.commit();
    }
    $("#xGm").addEventListener("click", function () { goal(-1); });
    $("#xGp").addEventListener("click", function () { goal(1); });
    $("#xMis").addEventListener("click", function (e) {
      var r = e.target.closest("[data-m]");
      if (!r) return;
      var k = r.getAttribute("data-m"), s = M.state().settings;
      if (s.missions[k] && M.active().length <= 1) { toast("Mantenha pelo menos uma missão"); return; }
      s.missions[k] = !s.missions[k];
      focusKey = k;
      M.commit();
    });
    $("#xInstall").addEventListener("click", function () {
      if (!deferred) return;
      deferred.prompt(); deferred = null; this.hidden = true;
    });
    if (deferred) $("#xInstall").hidden = false;
  }
  function renderSettings() {
    var s = M.state().settings;
    $("#xGv").textContent = s.waterGoal;
    $("#xMis").innerHTML = Object.keys(LBL).map(function (k) { return row("data-m", k, s.missions[k], LBL[k]); }).join("");
    if (focusKey) { var f = $("[data-m='" + focusKey + "']"); if (f) f.focus(); focusKey = null; }
  }

  /* ---------- Tendências 7 / 30 / 90 dias (Progresso) ---------- */
  var range = 7;
  var METRICS = [
    { k: "Missões concluídas", u: "%", dec: 0, max: 100, f: function (d) { return M.score(d) / M.total() * 100; } },
    { k: "Água", u: " copos", dec: 1, f: function (d) { return d.water || 0; } },
    { k: "Sono", u: "h", dec: 1, f: sleepH }
  ];
  function series(n, off, f) {
    var a = [], days = M.state().days;
    for (var i = n - 1; i >= 0; i--) { var d = days[M.key(-(i + off))]; a.push(d ? f(d) : null); }
    return a;
  }
  function avg(a) {
    var v = a.filter(function (x) { return x != null; });
    return v.length ? v.reduce(function (x, y) { return x + y; }, 0) / v.length : null;
  }
  function chart(a, max) {
    var n = a.length, w = 300 / n, h = "";
    a.forEach(function (v, i) {
      var bh = v == null ? 2 : Math.max(2, v / max * 54);
      h += "<rect x='" + (i * w + w * 0.15).toFixed(1) + "' y='" + (56 - bh).toFixed(1) + "' width='" + (w * 0.7).toFixed(1) +
        "' height='" + bh.toFixed(1) + "' rx='1.5' fill='" + (v == null ? "var(--line)" : "var(--green)") + "'/>";
    });
    return "<svg viewBox='0 0 300 56' preserveAspectRatio='none' class='x-chart' role='img' aria-label='Gráfico de barras'>" + h + "</svg>";
  }
  function buildTrends() {
    var c = make("div", "card x-card");
    c.innerHTML = "<h3>Tendências</h3><div class='x-tabs' id='xTabs'></div><div id='xTr'></div>";
    $("#page-progresso").appendChild(c);
    $("#xTabs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-r]");
      if (b) { range = +b.getAttribute("data-r"); renderTrends(); }
    });
  }
  function renderTrends() {
    $("#xTabs").innerHTML = [7, 30, 90].map(function (r) {
      return "<button type='button' class='x-tab" + (r === range ? " on" : "") + "' data-r='" + r + "' aria-pressed='" + (r === range) + "'>" + r + " dias</button>";
    }).join("");
    $("#xTr").innerHTML = METRICS.map(function (m) {
      var cur = series(range, 0, m.f), prev = series(range, range, m.f), a = avg(cur), b = avg(prev);
      var max = m.max || Math.max.apply(null, cur.map(function (x) { return x || 0; }).concat([1]));
      var delta = "";
      if (a != null && b != null) {
        var df = a - b, up = df >= 0.05, down = df <= -0.05;
        delta = " <span class='x-delta " + (up ? "up" : down ? "down" : "") + "'>" + (up ? "▲ +" : down ? "▼ " : "= ") + (up || down ? df.toFixed(m.dec) : "") + " vs. período anterior</span>";
      }
      return "<div class='x-trend'><div class='x-trend-top'><b>" + m.k + "</b><span>" +
        (a == null ? "—" : a.toFixed(m.dec) + m.u) + "</span></div>" + chart(cur, max) + "<div class='x-sub'>" + delta + "</div></div>";
    }).join("");
  }

  /* ---------- Peso opcional (Progresso) ---------- */
  function buildWeight() {
    var c = make("div", "card x-card");
    c.innerHTML = "<h3>Peso (opcional)</h3><p class='x-sub'>Só você vê. Registre quando quiser.</p>" +
      "<div class='x-row'><input type='text' inputmode='decimal' id='xW' placeholder='kg' aria-label='Peso em kg' style='width:110px'>" +
      "<button class='x-btn' id='xWSave' type='button'>Salvar hoje</button></div><div id='xWInfo'></div>";
    $("#page-progresso").appendChild(c);
    $("#xWSave").addEventListener("click", function () {
      var v = parseFloat(String($("#xW").value).replace(",", "."));
      if (!(v >= 20 && v <= 400)) { toast("Digite um peso válido em kg"); return; }
      M.state().weights[M.key(0)] = Math.round(v * 10) / 10;
      $("#xW").value = "";
      M.commit(); toast("Peso salvo ✓");
    });
  }
  function renderWeight() {
    var w = M.state().weights || {}, ks = Object.keys(w).sort().slice(-30);
    if (!ks.length) { $("#xWInfo").innerHTML = "<div class='x-sub' style='margin-top:10px'>Nenhum registro ainda.</div>"; return; }
    var vals = ks.map(function (k) { return w[k]; }), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), span = (mx - mn) || 1;
    var pts = vals.map(function (v, i) {
      return (vals.length === 1 ? 150 : i / (vals.length - 1) * 290 + 5).toFixed(1) + "," + (50 - (v - mn) / span * 44).toFixed(1);
    }).join(" ");
    var diff = vals[vals.length - 1] - vals[0];
    $("#xWInfo").innerHTML = "<svg viewBox='0 0 300 56' class='x-chart' role='img' aria-label='Evolução do peso'><polyline points='" + pts +
      "' fill='none' stroke='var(--green)' stroke-width='2.5' stroke-linejoin='round' stroke-linecap='round'/></svg>" +
      "<div class='x-sub'>Último: <b>" + vals[vals.length - 1].toFixed(1) + " kg</b>" + (vals.length > 1 ? " · variação " + (diff > 0 ? "+" : "") + diff.toFixed(1) + " kg no período" : "") + "</div>";
  }

  /* ---------- Rotinas manhã / noite (Hábitos) ---------- */
  var MORN = ["Beber água ao acordar", "Alongar por 2 minutos", "Pegar sol ou ar livre", "Planejar o dia"];
  var NIGHT = ["Desligar as telas 30 min antes", "Separar o que precisa para amanhã", "Higiene da noite", "Respirar fundo 3 vezes"];
  function buildRoutines() {
    var c = make("div", "card x-card");
    c.innerHTML = "<h3>Rotina da manhã</h3><div class='checklist' id='xMorn'></div>" +
      "<h3 style='margin-top:18px'>Rotina da noite</h3><div class='checklist' id='xNight'></div>";
    $("#page-habitos").appendChild(c);
    c.addEventListener("click", function (e) {
      var r = e.target.closest("[data-rt]");
      if (!r) return;
      var d = M.day(), id = r.getAttribute("data-rt");
      if (!d.routine) d.routine = {};
      d.routine[id] = !d.routine[id];
      if (d.routine[id]) M.award(d, "r-" + id, 2, false);
      M.commit();
    });
  }
  function renderRoutines() {
    var r = M.day().routine || {};
    $("#xMorn").innerHTML = MORN.map(function (t, i) { return row("data-rt", "m" + i, r["m" + i], t); }).join("");
    $("#xNight").innerHTML = NIGHT.map(function (t, i) { return row("data-rt", "n" + i, r["n" + i], t); }).join("");
  }

  /* ---------- Decoração do personagem (Conquistas) ---------- */
  var DECOR = [
    { id: "sol", lvl: 2, label: "Sol ☀️", svg: "<circle cx='84' cy='16' r='8' fill='#DE9F2E'/>" },
    { id: "borb", lvl: 3, label: "Borboleta 🦋", svg: "<ellipse cx='20' cy='44' rx='6' ry='4' fill='#D9694E' transform='rotate(-25 20 44)'/><ellipse cx='29' cy='44' rx='6' ry='4' fill='#5C7FA6' transform='rotate(25 29 44)'/>" },
    { id: "reg", lvl: 4, label: "Regador 🚿", svg: "<path d='M80 84h11l-2 9H82z' fill='#5C7FA6'/><path d='M80 86l-6-3' stroke='#5C7FA6' stroke-width='2.5' stroke-linecap='round'/>" },
    { id: "arco", lvl: 5, label: "Arco-íris 🌈", svg: "<g fill='none' stroke-width='3'><path d='M2 30a14 14 0 0 1 28 0' stroke='#D9694E'/><path d='M5 30a11 11 0 0 1 22 0' stroke='#DE9F2E'/><path d='M8 30a8 8 0 0 1 16 0' stroke='#5C7FA6'/></g>" },
    { id: "estr", lvl: 6, label: "Estrelas ✨", svg: "<path d='M86 44l2 5 5 .5-4 3.5 1.2 5-4.2-2.8-4.2 2.8 1.2-5-4-3.5 5-.5z' fill='#DE9F2E'/><circle cx='74' cy='8' r='2' fill='#DE9F2E'/><circle cx='94' cy='30' r='1.6' fill='#DE9F2E'/>" }
  ];
  function buildDecor() {
    var c = make("div", "card x-card");
    c.innerHTML = "<h3>Decoração do personagem</h3><p class='x-sub'>Itens são liberados ao subir de nível.</p><div class='x-decor' id='xDecor'></div>";
    $("#page-conquistas").appendChild(c);
    $("#xDecor").addEventListener("click", function (e) {
      var b = e.target.closest("[data-d]");
      if (!b || b.disabled) return;
      var eq = M.state().char.equipped, id = b.getAttribute("data-d"), i = eq.indexOf(id);
      if (i < 0) eq.push(id); else eq.splice(i, 1);
      M.commit();
    });
  }
  function renderDecor() {
    var s = M.state(), lv = M.level(s.points).l, eq = s.char.equipped;
    $("#xDecor").innerHTML = DECOR.map(function (d) {
      var ok = lv >= d.lvl, on = eq.indexOf(d.id) > -1;
      return "<button type='button' class='x-dec" + (on ? " on" : "") + "' data-d='" + d.id + "'" + (ok ? "" : " disabled") + " aria-pressed='" + on + "'>" +
        d.label + "<small>" + (ok ? (on ? "Em uso" : "Liberado") : "Nível " + d.lvl) + "</small></button>";
    }).join("");
    var w = $("#characterWrap"), add = "";
    DECOR.forEach(function (d) { if (lv >= d.lvl && eq.indexOf(d.id) > -1) add += d.svg; });
    if (add && w) w.innerHTML = w.innerHTML.replace(/<\/svg>\s*$/, add + "</svg>");
  }

  /* ---------- Acessibilidade ---------- */
  function a11y() {
    document.addEventListener("keydown", function (e) {
      var t = e.target;
      if ((e.key === "Enter" || e.key === " ") && t.matches && t.matches("[role=button],[role=checkbox]")) {
        e.preventDefault(); t.click();
      }
    });
    ["waterValue", "pauseValue"].forEach(function (id) {
      var n = document.getElementById(id);
      if (n && n.parentNode) n.parentNode.setAttribute("aria-live", "polite");
    });
  }

  function update() { renderSettings(); renderTrends(); renderWeight(); renderRoutines(); renderDecor(); }

  pwa(); a11y();
  buildSettings(); buildTrends(); buildWeight(); buildRoutines(); buildDecor();
  var prev = M.onChange;
  M.onChange = function () { if (prev) prev(); update(); };
  update();
})();

/* Meu Dia Saudável — perfis neste aparelho, PIN, pasta de backup e cor de destaque */
(function () {
  "use strict";
  var M = window.MDS;
  if (!M) return;
  var $ = M.$, make = M.make, toast = window.MDS_toast, P = M.profiles, page = $("#page-perfil");
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // shortcut: hash simples (djb2) só afasta olhares curiosos; proteção real exige login com servidor
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "" + h; }
  function cur() { return P.list.filter(function (p) { return p.id === P.active; })[0]; }
  function savePs() { localStorage.setItem("mds-profiles", JSON.stringify(P)); }
  function use(id) { P.active = id; savePs(); location.reload(); }
  function keyOf(id) { return id === "main" ? "meu-dia-saudavel-state" : "meu-dia-saudavel-state:" + id; }
  function unlocked(id, set) {
    try { if (set) sessionStorage.setItem("mds-ok:" + id, "1"); return !!sessionStorage.getItem("mds-ok:" + id); } catch (e) { return false; }
  }

  /* ---------- Cor de destaque ---------- */
  var AC = [["floresta", "Floresta"], ["mar", "Mar"], ["ameixa", "Ameixa"]], acc = localStorage.getItem("mds-accent") || "floresta";
  function paintAcc() {
    document.documentElement.setAttribute("data-accent", acc);
    $("#xAcc").innerHTML = AC.map(function (a) {
      return "<button type='button' class='x-dec" + (a[0] === acc ? " on" : "") + "' data-ac='" + a[0] + "' aria-pressed='" + (a[0] === acc) + "'>" + a[1] + "</button>";
    }).join("");
  }

  /* ---------- Trava por PIN ---------- */
  function lock() {
    var p = cur();
    if (!p.pin || unlocked(p.id)) return;
    var o = make("div", "x-lock");
    o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
    o.innerHTML = "<div class='card'><h2></h2><p class='x-sub'>Digite o PIN deste perfil.</p>" +
      "<input id='xLockPin' type='password' inputmode='numeric' maxlength='6' autocomplete='off' aria-label='PIN'>" +
      "<div class='x-err' id='xLockErr' aria-live='polite'></div><button class='x-btn' id='xLockGo' type='button'>Entrar</button><div class='x-row' id='xLockOther' style='justify-content:center'></div></div>";
    o.querySelector("h2").textContent = p.name;
    o.querySelector("#xLockOther").innerHTML = P.list.filter(function (q) { return q.id !== p.id; }).map(function (q) {
      return "<button class='x-btn ghost sm' type='button' data-use='" + q.id + "'>" + esc(q.name) + "</button>";
    }).join("");
    document.body.appendChild(o);
    var inp = o.querySelector("#xLockPin");
    function go() {
      if (hash(inp.value) === p.pin) { unlocked(p.id, true); o.remove(); return; }
      o.querySelector("#xLockErr").textContent = "PIN incorreto.";
      inp.value = ""; inp.focus();
    }
    o.querySelector("#xLockGo").addEventListener("click", go);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    o.addEventListener("click", function (e) { var b = e.target.closest("[data-use]"); if (b) use(b.getAttribute("data-use")); });
    inp.focus();
  }

  /* ---------- Cartões no Perfil ---------- */
  var pc = make("div", "card x-card");
  pc.innerHTML = "<h3>Perfis neste aparelho</h3><p class='x-sub'>Cada perfil guarda seus próprios dados. O PIN é uma trava simples, não criptografia.</p><div id='xProfs'></div>" +
    "<div class='x-row' style='margin-top:12px'><input id='xPName' maxlength='30' placeholder='Nome do novo perfil' aria-label='Nome do novo perfil'><button class='x-btn' id='xPAdd' type='button'>Criar perfil</button></div>" +
    "<div class='x-row' style='margin-top:12px'><input id='xPinIn' type='password' inputmode='numeric' maxlength='6' placeholder='PIN de 4 a 6 números' aria-label='PIN do perfil em uso'>" +
    "<button class='x-btn ghost' id='xPinSet' type='button'>Salvar PIN</button><button class='x-btn ghost' id='xPinOff' type='button'>Remover PIN</button></div>";
  var fc = make("div", "card x-card");
  fc.innerHTML = "<h3>Salvar em uma pasta</h3><p class='x-sub' id='xDirTxt'></p><div class='x-row' id='xDirBtns'></div><div class='x-sub' id='xDirInfo' style='margin-top:10px' aria-live='polite'></div>";
  var ac = make("div", "card x-card");
  ac.innerHTML = "<h3>Cor de destaque</h3><div class='x-decor' id='xAcc'></div>";
  page.appendChild(pc); page.appendChild(fc); page.appendChild(ac);

  function renderProfs() {
    $("#xProfs").innerHTML = P.list.map(function (p) {
      var on = p.id === P.active;
      return "<div class='x-set x-prof'><span>" + esc(p.name) + (p.pin ? " · com PIN" : "") + (on ? " · em uso" : "") + "</span>" +
        (on ? "" : "<span class='x-row'><button class='x-btn ghost sm' data-use='" + p.id + "' type='button'>Usar</button><button class='x-btn ghost sm' data-del='" + p.id + "' type='button'>Excluir</button></span>") + "</div>";
    }).join("");
    $("#xPinOff").hidden = !cur().pin;
  }
  pc.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.use) use(b.dataset.use);
    else if (b.dataset.del) {
      var q = P.list.filter(function (p) { return p.id === b.dataset.del; })[0];
      if (!confirm("Excluir o perfil \"" + q.name + "\" e todos os dados dele neste aparelho?")) return;
      P.list = P.list.filter(function (p) { return p !== q; });
      localStorage.removeItem(keyOf(q.id)); savePs(); renderProfs();
    } else if (b.id === "xPAdd") {
      var n = $("#xPName").value.trim();
      if (!n) { toast("Digite um nome para o perfil"); return; }
      var id = "p" + Date.now().toString(36);
      P.list.push({ id: id, name: n });
      localStorage.setItem(keyOf(id), JSON.stringify({ profile: { name: n, birthdate: "", photoData: null } }));
      use(id);
    } else if (b.id === "xPinSet") {
      var v = $("#xPinIn").value;
      if (!/^\d{4,6}$/.test(v)) { toast("Use de 4 a 6 números"); return; }
      cur().pin = hash(v); unlocked(P.active, true); savePs();
      $("#xPinIn").value = ""; renderProfs(); toast("PIN salvo");
    } else if (b.id === "xPinOff") { delete cur().pin; savePs(); renderProfs(); toast("PIN removido"); }
  });
  ac.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ac]");
    if (b) { acc = b.dataset.ac; localStorage.setItem("mds-accent", acc); paintAcc(); }
  });

  /* ---------- Pasta (File System Access: Chrome/Edge no computador) ---------- */
  var canDir = "showDirectoryPicker" in window, dir = null, mode = "none", info = "", timer = null;
  function idb(rw, fn) {
    return new Promise(function (res, rej) {
      var r = indexedDB.open("mds", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("h"); };
      r.onerror = function () { rej(r.error); };
      r.onsuccess = function () {
        var tx = r.result.transaction("h", rw), q = fn(tx.objectStore("h"));
        tx.oncomplete = function () { res(q && q.result); };
        tx.onerror = function () { rej(tx.error); };
      };
    });
  }
  function renderDir() {
    $("#xDirTxt").textContent = !canDir
      ? "Este navegador não permite escolher pastas (o Chrome e o Edge no computador permitem). Use Exportar, em Backup dos dados."
      : "Escolha uma pasta e o app cria nela a subpasta \"Meu Dia Saudavel\", com um arquivo por perfil, atualizado a cada mudança.";
    var B = { pick: "Escolher pasta", ask: "Reconectar pasta", swap: "Trocar pasta", save: "Salvar agora", load: "Carregar da pasta" };
    var set = !canDir ? [] : mode === "on" ? ["save", "load", "swap"] : mode === "ask" ? ["ask", "swap"] : ["pick"];
    $("#xDirBtns").innerHTML = set.map(function (k, i) { return "<button type='button' class='x-btn" + (i ? " ghost" : "") + "' data-act='" + k + "'>" + B[k] + "</button>"; }).join("");
    $("#xDirInfo").textContent = info;
  }
  function write(json) {
    if (!dir || mode !== "on") return Promise.resolve();
    return dir.getFileHandle(P.active + ".json", { create: true }).then(function (f) { return f.createWritable(); })
      .then(function (w) { return w.write(json).then(function () { return w.close(); }); })
      .then(function () { info = "Salvo na pasta às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + "."; renderDir(); })
      .catch(function () { mode = "ask"; info = "Não consegui salvar na pasta. Reconecte-a."; renderDir(); });
  }
  window.MDS_onSave = function (json) { clearTimeout(timer); timer = setTimeout(function () { write(json); }, 800); };
  function pick() {
    window.showDirectoryPicker({ mode: "readwrite" })
      .then(function (r) { return r.getDirectoryHandle("Meu Dia Saudavel", { create: true }); })
      .then(function (d) { dir = d; mode = "on"; return idb("readwrite", function (s) { return s.put(d, "dir"); }); })
      .then(function () { return write(JSON.stringify(M.state())); })
      .then(renderDir)
      .catch(function (e) { if (!e || e.name !== "AbortError") toast("Não foi possível usar essa pasta"); });
  }
  function load() {
    dir.getFileHandle(P.active + ".json").then(function (f) { return f.getFile(); }).then(function (f) { return f.text(); }).then(function (t) {
      var o = JSON.parse(t);
      if (!o || typeof o.days !== "object") throw new Error("inválido");
      if (!confirm("Isso substitui os dados atuais deste perfil pelos da pasta. Continuar?")) return;
      localStorage.setItem(M.store, t); location.reload();
    }).catch(function () { toast("Não encontrei um arquivo válido deste perfil na pasta"); });
  }
  fc.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"), a = b && b.dataset.act;
    if (a === "pick" || a === "swap") pick();
    else if (a === "save") { write(JSON.stringify(M.state())); }
    else if (a === "load") load();
    else if (a === "ask") dir.requestPermission({ mode: "readwrite" }).then(function (r) { if (r === "granted") { mode = "on"; write(JSON.stringify(M.state())); } renderDir(); });
  });
  if (canDir && window.indexedDB) {
    idb("readonly", function (s) { return s.get("dir"); }).then(function (h) {
      if (!h) return;
      dir = h; mode = "ask";
      return h.queryPermission({ mode: "readwrite" }).then(function (r) { if (r === "granted") mode = "on"; });
    }).then(renderDir).catch(renderDir);
  }

  paintAcc(); renderProfs(); renderDir(); lock();
})();

/* Meu Dia Saudável — indicador deslizante da navegação (barra lateral e barra inferior) */
(function () {
  "use strict";
  var navs = document.querySelectorAll(".bottom-tabbar, .sidebar-nav");
  Array.prototype.forEach.call(document.querySelectorAll(".sidebar-nav .nav-item:not(.sidebar-profile-btn)"), function (b) { b.title = b.textContent.trim(); }); // dica no trilho de ícones
  function place(n) {
    var a = n.querySelector(".nav-item.active");
    if (!a || !a.offsetWidth) return; // barra escondida neste tamanho de tela
    n.style.setProperty("--x", a.offsetLeft + a.offsetWidth / 2 + "px");
    n.style.setProperty("--y", a.offsetTop + "px");
    n.style.setProperty("--h", a.offsetHeight + "px");
    if (!n.hasAttribute("data-ready")) {
      n.setAttribute("data-ready", "");
      requestAnimationFrame(function () { requestAnimationFrame(function () { n.setAttribute("data-anim", ""); }); });
    }
  }
  function all() { Array.prototype.forEach.call(navs, place); }
  Array.prototype.forEach.call(navs, function (n) {
    new MutationObserver(function () { place(n); }).observe(n, { attributes: true, attributeFilter: ["class"], subtree: true });
  });
  window.addEventListener("resize", all);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(all);
  all();
})();
