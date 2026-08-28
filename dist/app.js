(() => {
  const questions = Array.isArray(window.JAVA_QUESTIONS) ? window.JAVA_QUESTIONS : [];
  const exercises = Array.isArray(window.JAVA_EXERCISES) ? window.JAVA_EXERCISES : [];
  const app = document.querySelector('#app');
  const toast = document.querySelector('#toast');
  const footerCount = document.querySelector('#footer-count');

  const state = {
    homeSearch: '',
    homeTopic: 'all',
    questionSearch: '',
    questionTopic: 'all',
    questionChapter: 'all',
    exerciseSearch: '',
    exerciseTopic: 'all',
    exerciseChapter: 'all',
    solutionSearch: '',
    solutionTopic: 'all',
    solutionChapter: 'all',
    expanded: new Set()
  };

  const chapters = [...new Map(questions.map((q) => [q.chapterId, {
    id: q.chapterId,
    label: q.chapter,
    title: q.chapterTitle,
    number: q.chapterNumber
  }])).values()].sort((a, b) => a.number - b.number);
  const topics = [...new Set(questions.map((q) => q.topic))].sort();
  const exerciseChapters = [...new Map(exercises.map((exercise) => [exercise.chapterId, {
    id: exercise.chapterId,
    label: exercise.chapter,
    title: exercise.chapterTitle,
    number: exercise.chapterNumber
  }])).values()].sort((a, b) => a.number - b.number);
  const exerciseTopics = [...new Set(exercises.map((exercise) => exercise.topic))].sort();

  footerCount.textContent = `${questions.length} questions · ${exercises.length} paired textbook exercises`;

  const icons = {
    search: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    download: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 20h14"/></svg>',
    chevron: '<svg class="chapter-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
    arrow: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>',
    copy: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/></svg>',
    file: '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>'
  };

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function highlightJava(source) {
    const keywords = new Set('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while'.split(' '));
    const tokenPattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g;
    let output = '';
    let cursor = 0;

    for (const match of source.matchAll(tokenPattern)) {
      const token = match[0];
      output += escapeHtml(source.slice(cursor, match.index));
      let className = '';
      if (token.startsWith('//') || token.startsWith('/*')) className = 'token-comment';
      else if (token.startsWith('"') || token.startsWith("'")) className = 'token-string';
      else if (/^\d/.test(token)) className = 'token-number';
      else if (keywords.has(token)) className = 'token-keyword';
      output += className ? `<span class="${className}">${escapeHtml(token)}</span>` : escapeHtml(token);
      cursor = match.index + token.length;
    }
    output += escapeHtml(source.slice(cursor));

    return output.split('\n').map((line) => `<span class="code-line">${line || ' '}</span>`).join('');
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.add('opacity-0', 'translate-y-4'), 1800);
  }

  function selectOptions(items, selected, allLabel) {
    return `<option value="all">${allLabel}</option>${items.map((item) => {
      const value = typeof item === 'string' ? item : item.id;
      const label = typeof item === 'string' ? item : `${item.label} · ${item.title}`;
      return `<option value="${escapeHtml(value)}" ${value === selected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
    }).join('')}`;
  }

  function matches(question, search, topic = 'all', chapter = 'all') {
    const query = search.trim().toLowerCase();
    const haystack = `${question.filename} ${question.title} ${question.question} ${question.solution} ${question.topic} ${question.chapterTitle}`.toLowerCase();
    return (!query || haystack.includes(query))
      && (topic === 'all' || question.topic === topic)
      && (chapter === 'all' || question.chapterId === chapter);
  }

  function matchesExercise(exercise, search, topic = 'all', chapter = 'all') {
    const query = search.trim().toLowerCase();
    const haystack = `${exercise.displayNumber} ${exercise.title} ${exercise.name} ${exercise.prompt} ${exercise.solutionText} ${exercise.topic} ${exercise.chapterTitle}`.toLowerCase();
    return (!query || haystack.includes(query))
      && (topic === 'all' || exercise.topic === topic)
      && (chapter === 'all' || exercise.chapterId === chapter);
  }

  function setActiveNav(route) {
    document.querySelectorAll('[data-nav]').forEach((link) => {
      const isQuestions = route.startsWith('questions') || route.startsWith('question');
      const isExercises = route.startsWith('exercises') || route.startsWith('exercise');
      const isSolutions = route.startsWith('solutions') || route.startsWith('solution');
      const active = isQuestions ? 'questions' : isExercises ? 'exercises' : isSolutions ? 'solutions' : 'home';
      link.classList.toggle('active', link.dataset.nav === active);
    });
  }

  function filtersBar({ context, search, topic, chapter, count }) {
    return `
      <div class="apple-filter-bar rounded-3xl border border-slate-200 bg-white p-4 shadow-lift sm:p-5">
        <div class="grid gap-3 ${context === 'questions' ? 'lg:grid-cols-[1fr_220px_250px_auto]' : 'lg:grid-cols-[1fr_240px_auto]'}">
          <label class="relative block">
            <span class="sr-only">Search questions</span>
            <span class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400">${icons.search}</span>
            <input id="${context}-search" type="search" value="${escapeHtml(search)}" placeholder="Search names, prompts, or code…" class="search-input h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
          </label>
          <label>
            <span class="sr-only">Filter by topic</span>
            <select id="${context}-topic" class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              ${selectOptions(topics, topic, 'All topics')}
            </select>
          </label>
          ${context === 'questions' ? `<label><span class="sr-only">Filter by chapter</span><select id="questions-chapter" class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">${selectOptions(chapters, chapter, 'All chapters')}</select></label>` : ''}
          <button data-action="clear-${context}" class="h-12 rounded-xl px-4 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-ink">Clear</button>
        </div>
        <p class="mt-3 px-1 text-xs font-bold uppercase tracking-[.14em] text-slate-400"><span id="${context}-result-count">${count}</span> results</p>
      </div>`;
  }

  function exerciseFiltersBar({ context, search, topic, chapter, count }) {
    const noun = context === 'solutions' ? 'solutions' : 'exercises';
    return `
      <div class="apple-filter-bar rounded-3xl border border-slate-200 bg-white p-4 shadow-lift sm:p-5">
        <div class="grid gap-3 lg:grid-cols-[1fr_220px_250px_auto]">
          <label class="relative block">
            <span class="sr-only">Search ${noun}</span>
            <span class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400">${icons.search}</span>
            <input id="${context}-search" type="search" value="${escapeHtml(search)}" placeholder="Search numbers, prompts, names, or code…" class="search-input h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100" />
          </label>
          <label>
            <span class="sr-only">Filter by topic</span>
            <select id="${context}-topic" class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              ${selectOptions(exerciseTopics, topic, 'All topics')}
            </select>
          </label>
          <label>
            <span class="sr-only">Filter by chapter</span>
            <select id="${context}-chapter" class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
              ${selectOptions(exerciseChapters, chapter, 'All chapters')}
            </select>
          </label>
          <button data-action="clear-${context}" class="h-12 rounded-xl px-4 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-ink">Clear</button>
        </div>
        <p class="mt-3 px-1 text-xs font-bold uppercase tracking-[.14em] text-slate-400"><span id="${context}-result-count">${count}</span> ${noun}</p>
      </div>`;
  }

  function questionRow(question, index) {
    return `
      <a href="#/question/${encodeURIComponent(question.id)}" class="group grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-transparent px-3 py-3 transition hover:border-slate-200 hover:bg-white hover:shadow-sm sm:px-4">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 font-mono text-[11px] font-bold text-slate-500 transition group-hover:bg-blue-100 group-hover:text-ember">${String(index + 1).padStart(2, '0')}</span>
        <span class="min-w-0">
          <span class="block truncate text-sm font-extrabold text-ink">${escapeHtml(question.filename)}</span>
          <span class="mt-1 block truncate text-xs font-medium text-slate-500">${escapeHtml(question.question.replace(/\s+/g, ' '))}</span>
        </span>
        <span class="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-ember">${icons.arrow}</span>
      </a>`;
  }

  function renderHome() {
    const filtered = questions.filter((q) => matches(q, state.homeSearch, state.homeTopic));
    const grouped = chapters.map((chapter) => ({
      ...chapter,
      questions: filtered.filter((q) => q.chapterId === chapter.id),
      total: questions.filter((q) => q.chapterId === chapter.id).length
    })).filter((chapter) => chapter.questions.length);

    app.innerHTML = `
      <section class="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div class="apple-hero relative overflow-hidden rounded-[2.25rem] px-6 py-16 sm:px-10 sm:py-24 lg:px-16 lg:py-28">
          <div class="apple-hero-orb apple-hero-orb-one" aria-hidden="true"></div>
          <div class="apple-hero-orb apple-hero-orb-two" aria-hidden="true"></div>
          <div class="relative mx-auto max-w-4xl text-center fade-up">
            <div class="apple-eyebrow mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold">
              Practice It · 4th Edition
            </div>
            <h1 class="apple-display text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-7xl lg:text-8xl">Learn Java.<br/><span class="apple-gradient-text">One problem at a time.</span></h1>
            <p class="apple-hero-copy mx-auto mt-7 max-w-2xl text-base font-normal leading-7 sm:text-xl sm:leading-8">A focused library for questions, textbook exercises, and matched solutions. Search quickly, study chapter by chapter, and export clean PDFs whenever you need them.</p>
            <div class="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="#/questions" class="apple-button apple-button-primary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold">Browse questions <span class="h-4 w-4">${icons.arrow}</span></a>
              <a href="#/exercises" class="apple-button apple-button-secondary inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold">View exercises <span class="h-4 w-4">${icons.arrow}</span></a>
            </div>
            <div class="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
              <button data-action="print-all" class="apple-text-link inline-flex items-center gap-1.5"><span class="h-4 w-4">${icons.download}</span> Questions PDF</button>
              <button data-action="print-all-exercises" class="apple-text-link inline-flex items-center gap-1.5"><span class="h-4 w-4">${icons.download}</span> Exercises PDF</button>
            </div>
          </div>
          <div class="apple-stats relative mx-auto mt-14 grid max-w-3xl grid-cols-3 divide-x sm:mt-16">
            <div class="px-2 text-center sm:px-6"><strong class="block text-2xl font-semibold tracking-tight sm:text-3xl">${questions.length}</strong><span class="mt-1 block text-[11px] font-medium uppercase tracking-[.08em]">Questions</span></div>
            <div class="px-2 text-center sm:px-6"><strong class="block text-2xl font-semibold tracking-tight sm:text-3xl">${exercises.length}</strong><span class="mt-1 block text-[11px] font-medium uppercase tracking-[.08em]">Exercises</span></div>
            <div class="px-2 text-center sm:px-6"><strong class="block text-2xl font-semibold tracking-tight sm:text-3xl">${exerciseChapters.length}</strong><span class="mt-1 block text-[11px] font-medium uppercase tracking-[.08em]">Sections</span></div>
          </div>
        </div>
      
        <div class="mt-10">
          ${filtersBar({ context: 'home', search: state.homeSearch, topic: state.homeTopic, count: filtered.length })}
        </div>

        <div class="mt-10 flex items-end justify-between gap-4">
          <div>
            <p class="text-xs font-extrabold uppercase tracking-[.18em] text-ember">Study path</p>
            <h2 class="mt-2 text-3xl font-semibold tracking-[-.025em]">Browse by chapter</h2>
          </div>
          <button data-action="toggle-all" class="hidden text-sm font-bold text-slate-500 hover:text-ember sm:block">Expand all</button>
        </div>

        <div class="mt-6 space-y-3" id="chapter-list">
          ${grouped.length ? grouped.map((chapter) => {
            const open = state.expanded.has(chapter.id) || Boolean(state.homeSearch) || state.homeTopic !== 'all';
            return `
              <article class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lift">
                <button data-action="toggle-chapter" data-chapter="${chapter.id}" aria-expanded="${open}" class="flex w-full items-center gap-4 p-5 text-left sm:p-6">
                  <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-sm font-extrabold text-white">${chapter.id === 'graphics' ? 'GFX' : String(chapter.number).padStart(2, '0')}</span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-xs font-extrabold uppercase tracking-[.15em] text-ember">${escapeHtml(chapter.label)}</span>
                    <span class="mt-1 block truncate text-base font-extrabold sm:text-lg">${escapeHtml(chapter.title)}</span>
                  </span>
                  <span class="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 sm:block">${chapter.questions.length}${chapter.questions.length !== chapter.total ? ` of ${chapter.total}` : ''}</span>
                  <span class="h-5 w-5 text-slate-400">${icons.chevron}</span>
                </button>
                <div class="chapter-panel ${open ? 'open' : ''}"><div><div class="border-t border-slate-100 p-2 sm:p-3">${chapter.questions.map(questionRow).join('')}</div></div></div>
              </article>`;
          }).join('') : `<div class="rounded-3xl border border-dashed border-slate-300 bg-white/50 px-6 py-16 text-center"><p class="text-lg font-extrabold">No questions found</p><p class="mt-2 text-sm text-slate-500">Try a different search or clear the topic filter.</p></div>`}
        </div>
      </section>`;
  }

  function renderQuestions() {
    const filtered = questions.filter((q) => matches(q, state.questionSearch, state.questionTopic, state.questionChapter));
    const grouped = chapters.map((chapter) => ({ ...chapter, questions: filtered.filter((q) => q.chapterId === chapter.id) })).filter((chapter) => chapter.questions.length);

    app.innerHTML = `
      <section class="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div class="max-w-3xl fade-up">
          <p class="text-xs font-extrabold uppercase tracking-[.18em] text-ember">Complete directory</p>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">All Java questions</h1>
          <p class="mt-4 text-base font-medium leading-7 text-slate-500">Search the full prompt and solution text, then narrow the collection by topic or chapter.</p>
        </div>
        <div class="mt-8">${filtersBar({ context: 'questions', search: state.questionSearch, topic: state.questionTopic, chapter: state.questionChapter, count: filtered.length })}</div>
        <div class="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside class="hidden lg:block">
            <div class="sticky top-28 rounded-2xl border border-slate-200 bg-white p-4">
              <p class="px-2 pb-3 text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">On this page</p>
              <div class="space-y-1">${grouped.map((chapter) => `<button type="button" data-action="scroll-chapter" data-target="directory-${chapter.id}" class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-bold text-slate-500 transition hover:bg-blue-50 hover:text-ember"><span>${escapeHtml(chapter.label)}</span><span>${chapter.questions.length}</span></button>`).join('')}</div>
            </div>
          </aside>
          <div class="space-y-10">
            ${grouped.length ? grouped.map((chapter) => `
              <section id="directory-${chapter.id}" class="scroll-mt-28">
                <div class="mb-4 flex items-end justify-between border-b border-slate-200 pb-4">
                  <div><p class="text-xs font-extrabold uppercase tracking-[.15em] text-ember">${escapeHtml(chapter.label)}</p><h2 class="mt-1 text-2xl font-semibold tracking-[-.02em]">${escapeHtml(chapter.title)}</h2></div>
                  <span class="text-xs font-bold text-slate-400">${chapter.questions.length} questions</span>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">${chapter.questions.map((q) => `
                  <a href="#/question/${encodeURIComponent(q.id)}" class="group flex min-h-36 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lift">
                    <div><div class="flex items-center justify-between gap-3"><span class="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ember">${escapeHtml(q.topic)}</span><span class="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-ember">${icons.arrow}</span></div><h3 class="mt-4 truncate font-mono text-sm font-bold">${escapeHtml(q.filename)}</h3></div>
                    <p class="mt-3 line-clamp-2 text-xs font-medium leading-5 text-slate-500">${escapeHtml(q.question.replace(/\s+/g, ' '))}</p>
                  </a>`).join('')}</div>
              </section>`).join('') : `<div class="rounded-3xl border border-dashed border-slate-300 bg-white/50 px-6 py-20 text-center"><p class="text-xl font-extrabold">Nothing matches those filters</p><button data-action="clear-questions" class="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">Clear filters</button></div>`}
          </div>
        </div>
      </section>`;
  }

  function renderExerciseDirectory(mode) {
    const isSolutions = mode === 'solutions';
    const search = isSolutions ? state.solutionSearch : state.exerciseSearch;
    const topic = isSolutions ? state.solutionTopic : state.exerciseTopic;
    const chapterFilter = isSolutions ? state.solutionChapter : state.exerciseChapter;
    const filtered = exercises.filter((exercise) => matchesExercise(exercise, search, topic, chapterFilter));
    const grouped = exerciseChapters.map((chapter) => ({
      ...chapter,
      exercises: filtered.filter((exercise) => exercise.chapterId === chapter.id)
    })).filter((chapter) => chapter.exercises.length);
    const singularRoute = isSolutions ? 'solution' : 'exercise';
    const previewField = isSolutions ? 'solutionText' : 'prompt';

    document.title = `${isSolutions ? 'Solutions' : 'Exercises'} · Java Practice Library`;
    app.innerHTML = `
      <section class="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <div class="max-w-3xl fade-up">
          <div class="flex flex-wrap items-center gap-3">
            <p class="text-xs font-extrabold uppercase tracking-[.18em] text-ember">Building Java Programs · 4th Edition</p>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Private study copy</span>
          </div>
          <h1 class="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">${isSolutions ? 'Matched solutions' : 'Textbook exercises'}</h1>
          <p class="mt-4 text-base font-medium leading-7 text-slate-500">${isSolutions ? 'Browse the HTML solutions matched to their corresponding PDF exercises. Each page includes the original prompt for context.' : 'Browse 390 exercise prompts extracted from the supplied PDF. Every exercise opens with its matched HTML solution.'}</p>
        </div>
        <div class="mt-8">${exerciseFiltersBar({ context: mode, search, topic, chapter: chapterFilter, count: filtered.length })}</div>

        <div class="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside class="hidden lg:block">
            <div class="sticky top-40 rounded-2xl border border-slate-200 bg-white p-4">
              <p class="px-2 pb-3 text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">On this page</p>
              <div class="space-y-1">${grouped.map((chapter) => `<button type="button" data-action="scroll-chapter" data-target="${mode}-directory-${chapter.id}" class="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-bold text-slate-500 transition hover:bg-blue-50 hover:text-ember"><span>${escapeHtml(chapter.label)}</span><span>${chapter.exercises.length}</span></button>`).join('')}</div>
            </div>
          </aside>

          <div class="space-y-10">
            ${grouped.length ? grouped.map((chapter) => `
              <section id="${mode}-directory-${chapter.id}" class="scroll-mt-44">
                <div class="mb-4 flex items-end justify-between border-b border-slate-200 pb-4">
                  <div><p class="text-xs font-extrabold uppercase tracking-[.15em] text-ember">${escapeHtml(chapter.label)}</p><h2 class="mt-1 text-2xl font-semibold tracking-[-.02em]">${escapeHtml(chapter.title)}</h2></div>
                  <span class="text-xs font-bold text-slate-400">${chapter.exercises.length} ${isSolutions ? 'solutions' : 'exercises'}</span>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">${chapter.exercises.map((exercise) => `
                  <a href="#/${singularRoute}/${encodeURIComponent(exercise.id)}" class="group flex min-h-40 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lift">
                    <div>
                      <div class="flex items-center justify-between gap-3"><span class="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ember">${escapeHtml(exercise.topic)}</span><span class="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-ember">${icons.arrow}</span></div>
                      <h3 class="mt-4 text-sm font-extrabold">${escapeHtml(exercise.title)}</h3>
                    </div>
                    <div class="mt-3">
                      <p class="line-clamp-2 text-xs font-medium leading-5 text-slate-500">${escapeHtml(exercise[previewField].replace(/\s+/g, ' '))}</p>
                      ${isSolutions && exercise.solutionVariants.length > 1 ? `<p class="mt-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">${exercise.solutionVariants.length} solution variants</p>` : ''}
                    </div>
                  </a>`).join('')}</div>
              </section>`).join('') : `<div class="rounded-3xl border border-dashed border-slate-300 bg-white/50 px-6 py-20 text-center"><p class="text-xl font-extrabold">Nothing matches those filters</p><button data-action="clear-${mode}" class="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">Clear filters</button></div>`}
          </div>
        </div>
      </section>`;
  }

  function solutionVariantsHtml(exercise, stepNumber = '02') {
    return `
      <section id="matched-solution" class="mt-10 scroll-mt-44">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3"><span class="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs font-extrabold text-white">${stepNumber}</span><h2 class="text-sm font-extrabold uppercase tracking-[.16em]">Matched solution</h2></div>
          <button data-action="copy-exercise-solution" data-id="${exercise.id}" class="no-print inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-ember"><span class="h-4 w-4">${icons.copy}</span> Copy solution</button>
        </div>
        <div class="space-y-5">${exercise.solutionVariants.map((variant, index) => `
          <div class="solution-variant overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            ${exercise.solutionVariants.length > 1 ? `<div class="border-b border-slate-200 bg-white px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-500">Solution variant ${index + 1}</div>` : ''}
            <div class="solution-html p-5 sm:p-6">${variant.html}</div>
          </div>`).join('')}</div>
      </section>`;
  }

  function exercisePromptHtml(exercise, stepNumber = '01') {
    return `
      <section class="mt-10">
        <div class="mb-4 flex items-center gap-3"><span class="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-xs font-extrabold text-ember">${stepNumber}</span><h2 class="text-sm font-extrabold uppercase tracking-[.16em]">Exercise prompt</h2></div>
        <div class="prompt-text rounded-2xl border border-blue-100 bg-blue-50/60 p-5 font-medium leading-7 text-slate-700 sm:p-6">${escapeHtml(exercise.prompt)}</div>
        ${exercise.hasFigureReference ? `<div class="no-print mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"><span>This exercise references a figure or diagram from the textbook.</span><a href="/private-source/exercises.pdf#page=${exercise.pdfPage}" target="_blank" rel="noopener" class="font-extrabold underline decoration-sky-400 underline-offset-4">View source page ${exercise.pdfPage}</a></div>` : ''}
      </section>`;
  }

  function enhanceSolutionCode() {
    document.querySelectorAll('.solution-html pre.java').forEach((pre) => {
      const source = pre.textContent.replace(/^\n|\n$/g, '');
      pre.className = 'code-wrap overflow-x-auto rounded-xl bg-slate-950 py-5 font-mono text-[13px] leading-6 text-slate-200 shadow-inner';
      pre.innerHTML = `<code>${highlightJava(source)}</code>`;
    });
  }

  function renderExerciseDetail(id, mode) {
    const index = exercises.findIndex((exercise) => exercise.id === id);
    if (index < 0) return renderNotFound();
    const exercise = exercises[index];
    const previous = exercises[index - 1];
    const next = exercises[index + 1];
    const isSolution = mode === 'solution';
    const route = isSolution ? 'solution' : 'exercise';
    const directory = isSolution ? 'solutions' : 'exercises';
    const directoryLabel = isSolution ? 'Solutions' : 'Exercises';
    const firstSection = isSolution ? solutionVariantsHtml(exercise, '01') : exercisePromptHtml(exercise, '01');
    const secondSection = isSolution ? exercisePromptHtml(exercise, '02') : solutionVariantsHtml(exercise, '02');

    document.title = `${exercise.title} · ${directoryLabel}`;
    app.innerHTML = `
      <section class="question-shell mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div class="no-print flex flex-wrap items-center justify-between gap-4">
          <nav class="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400" aria-label="Breadcrumb"><a href="#/${directory}" class="hover:text-ember">${directoryLabel}</a><span>/</span><span>${escapeHtml(exercise.chapter)}</span><span>/</span><span class="text-slate-600">Exercise ${escapeHtml(exercise.displayNumber)}</span></nav>
          <div class="flex flex-wrap gap-2"><a href="/private-source/exercises.pdf#page=${exercise.pdfPage}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold shadow-sm transition hover:border-blue-200 hover:text-ember"><span class="h-4 w-4">${icons.file}</span> Source page ${exercise.pdfPage}</a><button data-action="print-exercise" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold shadow-sm transition hover:border-blue-200 hover:text-ember"><span class="h-4 w-4">${icons.download}</span> Export PDF</button></div>
        </div>

        <article class="question-print-card mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lift sm:p-10">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-ember">${escapeHtml(exercise.topic)}</span>
            <span class="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-500">${escapeHtml(exercise.chapter)} · ${escapeHtml(exercise.chapterTitle)}</span>
            <span class="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.13em] text-slate-600">Private</span>
          </div>
          <h1 class="mt-6 text-3xl font-semibold tracking-[-.025em] sm:text-4xl">${escapeHtml(exercise.title)}</h1>
          ${firstSection}
          ${secondSection}
        </article>

        <nav class="no-print mt-6 grid gap-3 sm:grid-cols-2" aria-label="Exercise navigation">
          ${previous ? `<a href="#/${route}/${encodeURIComponent(previous.id)}" class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-lift"><span class="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">← Previous ${route}</span><span class="mt-2 block truncate text-sm font-bold transition group-hover:text-ember">${escapeHtml(previous.title)}</span></a>` : '<div></div>'}
          ${next ? `<a href="#/${route}/${encodeURIComponent(next.id)}" class="group rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-sm transition hover:border-blue-200 hover:shadow-lift"><span class="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">Next ${route} →</span><span class="mt-2 block truncate text-sm font-bold transition group-hover:text-ember">${escapeHtml(next.title)}</span></a>` : ''}
        </nav>
      </section>`;
    enhanceSolutionCode();
  }

  function solutionBlock(question) {
    return `<div class="code-wrap overflow-x-auto rounded-2xl bg-slate-950 py-5 font-mono text-[13px] leading-6 text-slate-200 shadow-inner"><code>${highlightJava(question.solution)}</code></div>`;
  }

  function renderQuestion(id) {
    const index = questions.findIndex((q) => q.id === id);
    if (index < 0) return renderNotFound();
    const question = questions[index];
    const previous = questions[index - 1];
    const next = questions[index + 1];

    document.title = `${question.filename} · Java Practice Library`;
    app.innerHTML = `
      <section class="question-shell mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div class="no-print flex flex-wrap items-center justify-between gap-4">
          <nav class="flex items-center gap-2 text-xs font-bold text-slate-400" aria-label="Breadcrumb"><a href="#/questions" class="hover:text-ember">Questions</a><span>/</span><span>${escapeHtml(question.chapter)}</span><span>/</span><span class="text-slate-600">${escapeHtml(question.filename)}</span></nav>
          <button data-action="print-question" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold shadow-sm transition hover:border-blue-200 hover:text-ember"><span class="h-4 w-4">${icons.download}</span> Export PDF</button>
        </div>

        <article class="question-print-card mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lift sm:p-10">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-ember">${escapeHtml(question.topic)}</span>
            <span class="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[.13em] text-slate-500">${escapeHtml(question.chapter)} · ${escapeHtml(question.chapterTitle)}</span>
          </div>
          <h1 class="mt-6 break-words font-mono text-3xl font-bold tracking-tight sm:text-4xl">${escapeHtml(question.filename)}</h1>

          <section class="mt-10">
            <div class="mb-4 flex items-center gap-3"><span class="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-xs font-extrabold text-ember">01</span><h2 class="text-sm font-extrabold uppercase tracking-[.16em]">Question</h2></div>
            <div class="prompt-text rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-sm font-medium leading-7 text-slate-700 sm:p-6 sm:text-base">${escapeHtml(question.question)}</div>
            ${!question.hasSourceQuestion ? '<p class="mt-3 text-xs font-semibold text-amber-700">Note: this source file did not contain a leading question comment.</p>' : ''}
          </section>

          <section class="mt-10">
            <div class="mb-4 flex items-center justify-between gap-3"><div class="flex items-center gap-3"><span class="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-xs font-extrabold text-white">02</span><h2 class="text-sm font-extrabold uppercase tracking-[.16em]">Solution</h2></div><button data-action="copy-code" data-id="${question.id}" class="no-print inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-ember"><span class="h-4 w-4">${icons.copy}</span> Copy code</button></div>
            ${solutionBlock(question)}
          </section>
        </article>

        <nav class="no-print mt-6 grid gap-3 sm:grid-cols-2" aria-label="Question navigation">
          ${previous ? `<a href="#/question/${encodeURIComponent(previous.id)}" class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-lift"><span class="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">← Previous question</span><span class="mt-2 block truncate font-mono text-sm font-bold transition group-hover:text-ember">${escapeHtml(previous.filename)}</span></a>` : '<div></div>'}
          ${next ? `<a href="#/question/${encodeURIComponent(next.id)}" class="group rounded-2xl border border-slate-200 bg-white p-5 text-right shadow-sm transition hover:border-blue-200 hover:shadow-lift"><span class="text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400">Next question →</span><span class="mt-2 block truncate font-mono text-sm font-bold transition group-hover:text-ember">${escapeHtml(next.filename)}</span></a>` : ''}
        </nav>
      </section>`;
  }

  function renderPrintAll(autoPrint = false) {
    document.title = 'Complete Java Practice Library';
    app.innerHTML = `
      <section class="print-shell mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8">
        <div class="no-print mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div><h1 class="text-xl font-extrabold">Complete PDF collection</h1><p class="mt-1 text-sm text-slate-500">${questions.length} questions and solutions. Choose “Save as PDF” in the print dialog.</p></div>
          <div class="flex gap-2"><a href="#/" class="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100">Back home</a><button data-action="print-now" class="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-extrabold text-white"><span class="h-4 w-4">${icons.download}</span> Print / Save PDF</button></div>
        </div>
        <div class="hidden print:block mb-10 border-b-2 border-black pb-6"><h1 class="text-3xl font-bold">Java Practice Library</h1><p class="mt-2">Complete collection · ${questions.length} questions and solutions</p></div>
        <div class="space-y-8">${questions.map((question, index) => `
          <article class="question-print-card rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p class="text-xs font-extrabold uppercase tracking-widest text-ember">${escapeHtml(question.chapter)} · ${escapeHtml(question.chapterTitle)} · ${escapeHtml(question.topic)}</p>
            <h2 class="mt-3 font-mono text-2xl font-bold">${index + 1}. ${escapeHtml(question.filename)}</h2>
            <h3 class="mt-7 text-xs font-extrabold uppercase tracking-widest">Question</h3>
            <div class="prompt-text mt-3 rounded-xl bg-blue-50 p-5 text-sm leading-6">${escapeHtml(question.question)}</div>
            <h3 class="mt-7 text-xs font-extrabold uppercase tracking-widest">Solution</h3>
            <div class="mt-3">${solutionBlock(question)}</div>
          </article>`).join('')}</div>
      </section>`;
    if (autoPrint) setTimeout(() => window.print(), 350);
  }

  function renderPrintAllExercises(autoPrint = false) {
    document.title = 'Complete Textbook Exercises · Java Practice Library';
    app.innerHTML = `
      <section class="print-shell mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8">
        <div class="no-print mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div><h1 class="text-xl font-extrabold">Complete exercises and solutions PDF</h1><p class="mt-1 text-sm text-slate-500">${exercises.length} exercise prompts with their matched solutions. Choose “Save as PDF” in the print dialog.</p></div>
          <div class="flex flex-wrap gap-2"><a href="#/" class="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100">Back home</a><button data-action="print-now" class="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-extrabold text-white"><span class="h-4 w-4">${icons.download}</span> Print / Save PDF</button></div>
        </div>
        <div class="hidden print:block mb-10 border-b-2 border-black pb-6"><h1 class="text-3xl font-bold">Building Java Programs · Exercises and Solutions</h1><p class="mt-2">Complete collection · ${exercises.length} exercises and solutions</p></div>
        <div class="space-y-8">${exercises.map((exercise, exerciseIndex) => `
          <article class="question-print-card rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p class="text-xs font-extrabold uppercase tracking-widest text-ember">${escapeHtml(exercise.chapter)} · ${escapeHtml(exercise.chapterTitle)} · ${escapeHtml(exercise.topic)} · Source page ${exercise.pdfPage}</p>
            <h2 class="mt-3 font-mono text-2xl font-bold">${exerciseIndex + 1}. ${escapeHtml(exercise.title)}</h2>
            <h3 class="mt-7 text-xs font-extrabold uppercase tracking-widest">Exercise</h3>
            <div class="prompt-text mt-3 rounded-xl bg-blue-50 p-5 text-sm leading-6">${escapeHtml(exercise.prompt)}</div>
            <h3 class="mt-7 text-xs font-extrabold uppercase tracking-widest">Solution</h3>
            <div class="mt-3 space-y-4">${exercise.solutionVariants.map((variant, index) => `
                  <div class="solution-variant">
                    ${exercise.solutionVariants.length > 1 ? `<p class="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Solution variant ${index + 1}</p>` : ''}
                    <div class="solution-html">${variant.html}</div>
                  </div>`).join('')}</div>
          </article>`).join('')}</div>
      </section>`;
    enhanceSolutionCode();
    if (autoPrint) setTimeout(() => window.print(), 450);
  }

  function renderNotFound() {
    document.title = 'Not found · Java Practice Library';
    app.innerHTML = `<section class="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-5 text-center"><div><p class="font-mono text-7xl font-bold text-blue-200">404</p><h1 class="mt-4 text-3xl font-extrabold">Question not found</h1><p class="mt-3 text-slate-500">That exercise may have moved or the link is incomplete.</p><a href="#/questions" class="mt-7 inline-block rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white">Browse questions</a></div></section>`;
  }

  function parseRoute() {
    const hash = location.hash.replace(/^#\/?/, '');
    if (!hash) return { name: 'home' };
    const [name, ...parts] = hash.split('/');
    return { name, parts };
  }

  function render() {
    const route = parseRoute();
    setActiveNav(route.name);
    document.querySelector('#site-header').classList.toggle('print-view', route.name === 'print');
    if (!['question', 'exercise', 'solution', 'print'].includes(route.name)) document.title = route.name === 'questions' ? 'Questions · Java Practice Library' : 'Java Practice Library';

    if (route.name === 'home') renderHome();
    else if (route.name === 'questions') renderQuestions();
    else if (route.name === 'question') renderQuestion(decodeURIComponent(route.parts[0] || ''));
    else if (route.name === 'exercises') renderExerciseDirectory('exercises');
    else if (route.name === 'solutions') renderExerciseDirectory('solutions');
    else if (route.name === 'exercise') renderExerciseDetail(decodeURIComponent(route.parts[0] || ''), 'exercise');
    else if (route.name === 'solution') renderExerciseDetail(decodeURIComponent(route.parts[0] || ''), 'solution');
    else if (route.name === 'print' && route.parts[0] === 'all') renderPrintAll(location.search.includes('autoprint=1'));
    else if (route.name === 'print' && route.parts[0] === 'exercises') renderPrintAllExercises(location.search.includes('autoprint=1'));
    else renderNotFound();

    window.scrollTo({ top: 0, behavior: 'auto' });
    app.focus({ preventScroll: true });
  }

  function rerenderCurrent() {
    const scrollY = window.scrollY;
    const route = parseRoute();
    if (route.name === 'home') renderHome();
    if (route.name === 'questions') renderQuestions();
    if (route.name === 'exercises') renderExerciseDirectory('exercises');
    if (route.name === 'solutions') renderExerciseDirectory('solutions');
    window.scrollTo(0, scrollY);
  }

  document.addEventListener('input', (event) => {
    if (event.target.id === 'home-search') state.homeSearch = event.target.value;
    else if (event.target.id === 'questions-search') state.questionSearch = event.target.value;
    else if (event.target.id === 'exercises-search') state.exerciseSearch = event.target.value;
    else if (event.target.id === 'solutions-search') state.solutionSearch = event.target.value;
    else return;
    rerenderCurrent();
    const input = document.querySelector(`#${event.target.id}`);
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  });

  document.addEventListener('change', (event) => {
    if (event.target.id === 'home-topic') state.homeTopic = event.target.value;
    else if (event.target.id === 'questions-topic') state.questionTopic = event.target.value;
    else if (event.target.id === 'questions-chapter') state.questionChapter = event.target.value;
    else if (event.target.id === 'exercises-topic') state.exerciseTopic = event.target.value;
    else if (event.target.id === 'exercises-chapter') state.exerciseChapter = event.target.value;
    else if (event.target.id === 'solutions-topic') state.solutionTopic = event.target.value;
    else if (event.target.id === 'solutions-chapter') state.solutionChapter = event.target.value;
    else return;
    rerenderCurrent();
  });

  document.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    if (action === 'toggle-theme') {
      const darkMode = !document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark', darkMode);
      target.setAttribute('aria-label', darkMode ? 'Use light mode' : 'Use dark mode');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#000000' : '#f5f5f7');
      try {
        localStorage.setItem('java-practice-theme', darkMode ? 'dark' : 'light');
      } catch (_) {}
    }
    if (action === 'scroll-chapter') {
      document.getElementById(target.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (action === 'toggle-chapter') {
      const chapter = target.dataset.chapter;
      state.expanded.has(chapter) ? state.expanded.delete(chapter) : state.expanded.add(chapter);
      const panel = target.nextElementSibling;
      const isOpen = state.expanded.has(chapter);
      target.setAttribute('aria-expanded', String(isOpen));
      panel.classList.toggle('open', isOpen);
    }
    if (action === 'toggle-all') {
      const visible = [...document.querySelectorAll('[data-action="toggle-chapter"]')];
      const shouldExpand = visible.some((button) => button.getAttribute('aria-expanded') === 'false');
      visible.forEach((button) => shouldExpand ? state.expanded.add(button.dataset.chapter) : state.expanded.delete(button.dataset.chapter));
      renderHome();
    }
    if (action === 'clear-home') {
      state.homeSearch = '';
      state.homeTopic = 'all';
      renderHome();
    }
    if (action === 'clear-questions') {
      state.questionSearch = '';
      state.questionTopic = 'all';
      state.questionChapter = 'all';
      renderQuestions();
    }
    if (action === 'clear-exercises') {
      state.exerciseSearch = '';
      state.exerciseTopic = 'all';
      state.exerciseChapter = 'all';
      renderExerciseDirectory('exercises');
    }
    if (action === 'clear-solutions') {
      state.solutionSearch = '';
      state.solutionTopic = 'all';
      state.solutionChapter = 'all';
      renderExerciseDirectory('solutions');
    }
    if (action === 'copy-code') {
      const question = questions.find((q) => q.id === target.dataset.id);
      if (!question) return;
      try {
        await navigator.clipboard.writeText(question.solution);
        showToast('Solution copied');
      } catch {
        showToast('Copy is unavailable in this browser');
      }
    }
    if (action === 'copy-exercise-solution') {
      const exercise = exercises.find((item) => item.id === target.dataset.id);
      if (!exercise) return;
      try {
        await navigator.clipboard.writeText(exercise.solutionText);
        showToast('Matched solution copied');
      } catch {
        showToast('Copy is unavailable in this browser');
      }
    }
    if (action === 'print-question' || action === 'print-exercise' || action === 'print-now') window.print();
    if (action === 'print-all') {
      location.hash = '#/print/all';
      setTimeout(() => window.print(), 400);
    }
    if (action === 'print-all-exercises') {
      location.hash = '#/print/exercises';
      setTimeout(() => window.print(), 500);
    }
  });

  window.addEventListener('hashchange', render);
  render();
})();
