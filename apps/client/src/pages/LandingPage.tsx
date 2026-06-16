import { motion, type Variants, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import {
  Code2, Terminal, Cpu, GitBranch, Layers, Zap,
  ChevronRight, Play, Star, CheckCircle, Braces, ArrowRight
} from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const } }),
};

const features = [
  { icon: Terminal, title: 'شرح بالكود الحقيقي', desc: 'كل درس مبني على أمثلة عملية بكود حقيقي يمكنك تنفيذه فورًا', color: 'from-green-500 to-emerald-600' },
  { icon: Braces, title: 'تحديات برمجية', desc: 'تدرب على مسائل حقيقية من مقابلات الشركات الكبرى', color: 'from-cyan-500 to-blue-600' },
  { icon: GitBranch, title: 'مشاريع كاملة', desc: 'ابنِ مشاريع حقيقية تُضيفها إلى portfolio خاص بك', color: 'from-violet-500 to-purple-600' },
  { icon: Cpu, title: 'خوارزميات وهياكل بيانات', desc: 'تعلّم Data Structures وAlgorithms من الصفر حتى الاحتراف', color: 'from-amber-500 to-orange-600' },
  { icon: Layers, title: 'مسارات تعليمية متكاملة', desc: 'Front-end, Back-end, Full-stack, DevOps — اختر مسارك', color: 'from-rose-500 to-pink-600' },
  { icon: Zap, title: 'تقييم فوري', desc: 'اختبارات تلقائية لقياس مستواك بعد كل وحدة', color: 'from-indigo-500 to-blue-600' },
];

const stats = [
  { value: '2,400+', label: 'مبرمج تخرّج' },
  { value: '80+', label: 'كورس برمجي' },
  { value: '15', label: 'لغة برمجة' },
  { value: '98%', label: 'نسبة التوظيف' },
];

const codeSnippets = [
  { lang: 'Python', color: '#3b82f6', code: `def fibonacci(n):
    if n <= 1: return n
    a, b = 0, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    return b

print(fibonacci(10))  # 55` },
  { lang: 'JavaScript', color: '#f59e0b', code: `const quickSort = (arr) => {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = arr.filter(x => x < pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
};` },
  { lang: 'TypeScript', color: '#8b5cf6', code: `interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  isEmpty(): boolean;
}

class ArrayStack<T> implements Stack<T> {
  private items: T[] = [];
  push = (item: T) => this.items.push(item);
  pop = () => this.items.pop();
  peek = () => this.items[this.items.length - 1];
  isEmpty = () => this.items.length === 0;
}` },
];

// Animated typing code block
function CodeBlock() {
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [displayedCode, setDisplayedCode] = useState('');
  const [charIdx, setCharIdx] = useState(0);
  const snippet = codeSnippets[snippetIdx];

  useEffect(() => {
    setDisplayedCode('');
    setCharIdx(0);
  }, [snippetIdx]);

  useEffect(() => {
    if (charIdx < snippet.code.length) {
      const timer = setTimeout(() => {
        setDisplayedCode(prev => prev + snippet.code[charIdx]);
        setCharIdx(prev => prev + 1);
      }, 18);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setSnippetIdx(prev => (prev + 1) % codeSnippets.length);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [charIdx, snippet]);

  const lines = displayedCode.split('\n');

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Glow */}
      <div className="absolute -inset-4 bg-primary-500/10 rounded-3xl blur-2xl" />
      <div className="relative glass rounded-2xl overflow-hidden border border-surface-200 shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-surface-900/80 border-b border-surface-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-surface-400 text-xs mx-auto font-mono">
            solution.{snippet.lang === 'Python' ? 'py' : snippet.lang === 'JavaScript' ? 'js' : 'ts'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold" style={{ color: snippet.color, background: `${snippet.color}20` }}>
            {snippet.lang}
          </span>
        </div>
        {/* Code area */}
        <div className="p-5 font-mono text-sm leading-relaxed min-h-[200px] bg-surface-950/50">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-4">
              <span className="select-none text-surface-700 w-5 text-right shrink-0">{i + 1}</span>
              <span className="text-green-300/90 whitespace-pre">{line}</span>
            </div>
          ))}
          {/* Cursor blink */}
          {charIdx < snippet.code.length && (
            <span className="inline-block w-2 h-4 bg-primary-400 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>
        {/* Status bar */}
        <div className="px-4 py-2 bg-surface-900/60 border-t border-surface-200 flex items-center justify-between text-[10px] font-mono text-surface-500">
          <span>UTF-8 • LF</span>
          <span>Ln {lines.length}, Col {(lines[lines.length - 1]?.length || 0) + 1}</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Running...
          </span>
        </div>
      </div>
    </div>
  );
}

// Animated counter
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-50 overflow-hidden" dir="rtl">
      {/* Animated grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-xl font-bold gradient-text font-mono">Elmansa</span>
            <span className="hidden sm:block text-xs text-surface-500 font-mono border border-surface-800 px-2 py-0.5 rounded-md">{"<coding />"}</span>
          </motion.div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-surface-300 hover:text-surface-50 transition-colors text-sm font-mono">
              $ login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-primary-500/25 font-mono"
            >
              git clone career →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div>
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm mb-6 font-mono"
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                {"// منصة البرمجة العربية #1"}
              </motion.div>

              <motion.h1
                variants={fadeUp} initial="hidden" animate="visible" custom={1}
                className="text-5xl md:text-6xl font-extrabold leading-tight mb-6"
              >
                تعلّم البرمجة
                <br />
                <span className="gradient-text font-mono">كالمحترفين</span>
                <br />
                <span className="text-surface-400 text-4xl font-mono font-light">{"{"} فكّر • كوّد • ابنِ {"}"}</span>
              </motion.h1>

              <motion.p
                variants={fadeUp} initial="hidden" animate="visible" custom={2}
                className="text-lg text-surface-400 mb-8 leading-relaxed max-w-lg"
              >
                من أساسيات البرمجة إلى بناء تطبيقات حقيقية — مسارات تعليمية متكاملة مع شرح الكود سطرًا بسطر، ومشاريع عملية تُوهّلك للسوق.
              </motion.p>

              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={3}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link
                  to="/register"
                  className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-primary-500/30 transition-all duration-300 hover:-translate-y-1 flex items-center gap-2"
                >
                  <Terminal className="w-5 h-5" />
                  ابدأ رحلتك الآن
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="group px-8 py-4 rounded-2xl border border-surface-700 text-surface-300 hover:text-surface-50 hover:border-primary-500/50 transition-all flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center group-hover:bg-primary-600/40 transition-colors">
                    <Play className="w-4 h-4 text-primary-400 ml-0.5" />
                  </div>
                  شاهد نموذج الشرح
                </button>
              </motion.div>

              {/* Tech stack badges */}
              <motion.div
                variants={fadeUp} initial="hidden" animate="visible" custom={4}
                className="mt-8 flex flex-wrap gap-2"
              >
                {['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git', 'Docker'].map(tech => (
                  <span key={tech} className="px-3 py-1 rounded-lg bg-surface-800/80 border border-surface-700 text-surface-300 text-xs font-mono hover:border-primary-500/40 hover:text-primary-300 transition-colors cursor-default">
                    {tech}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right: Code Editor */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
              <CodeBlock />
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={5}
          className="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { to: 2400, suffix: '+', label: 'مبرمج تخرّج' },
            { to: 80, suffix: '+', label: 'كورس برمجي' },
            { to: 15, suffix: '', label: 'لغة برمجة' },
            { to: 98, suffix: '%', label: 'نسبة التوظيف' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-6 text-center border border-surface-200 hover:border-primary-500/20 transition-all group">
              <div className="text-3xl font-extrabold gradient-text mb-1 font-mono">
                <Counter to={stat.to} suffix={stat.suffix} />
              </div>
              <div className="text-surface-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-mono text-sm mb-3 block">{"// features"}</span>
            <h2 className="text-4xl font-extrabold mb-4">
              لماذا Elmansa؟
            </h2>
            <p className="text-surface-400 text-lg max-w-xl mx-auto">
              ليس مجرد شرح — منهج مدروس يصنع مبرمجين حقيقيين
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                whileHover={{ y: -6 }}
                className="glass rounded-2xl p-6 border border-surface-200 hover:border-primary-500/30 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <feat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-surface-400 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-24 px-6 bg-surface-900/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-mono text-sm mb-3 block">{"// roadmap"}</span>
            <h2 className="text-4xl font-extrabold mb-4">مساراتنا البرمجية</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Front-End', icon: '🎨', skills: ['HTML/CSS', 'JavaScript', 'React', 'Next.js'], color: 'from-cyan-500 to-blue-600' },
              { title: 'Back-End', icon: '⚙️', skills: ['Node.js', 'Python', 'Databases', 'APIs'], color: 'from-purple-500 to-indigo-600' },
              { title: 'Full-Stack', icon: '🚀', skills: ['الـ Front + Back', 'DevOps أساسي', 'مشاريع كاملة', 'Portfolio'], color: 'from-primary-500 to-purple-600' },
            ].map((path, i) => (
              <motion.div
                key={path.title}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                whileHover={{ y: -4 }}
                className="glass rounded-2xl p-6 border border-surface-200 hover:border-primary-500/30 transition-all group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${path.color} flex items-center justify-center text-2xl mb-4 shadow-md group-hover:scale-105 transition-transform text-white`}>
                  {path.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{path.title}</h3>
                <ul className="space-y-2">
                  {path.skills.map(s => (
                    <li key={s} className="flex items-center gap-2 text-surface-300 text-sm">
                      <ArrowRight className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 font-mono text-sm mb-3 block">{"// getting_started()"}</span>
            <h2 className="text-4xl font-extrabold mb-4">كيف تبدأ؟</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'أنشئ حسابك', desc: 'سجّل وأرسل طلب الانضمام. نقبل فقط المتحمسين الجادين', icon: '📝' },
              { step: '02', title: 'انتظر الموافقة', desc: 'يراجع المدرس طلبك ويوافق عليه خلال 24 ساعة', icon: '✅' },
              { step: '03', title: 'كوّد واحتـرف', desc: 'ادخل إلى الكورسات، نفّذ الكود، وابنِ مشروعك الأول', icon: '💻' },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-md shadow-primary-500/25 text-white">
                  {s.icon}
                </div>
                <div className="text-primary-400 font-mono text-xs mb-2">{s.step}</div>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-surface-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="glass rounded-3xl p-12 border border-primary-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-purple-600/10" />
            {/* Decorative code */}
            <div className="absolute top-4 right-6 font-mono text-xs text-surface-700 select-none hidden sm:block">
              {`while(learning) { improve(); }`}
            </div>
            <div className="relative">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-4xl font-extrabold mb-4">جاهز لتصبح مبرمجًا محترفًا؟</h2>
              <p className="text-surface-400 text-lg mb-8">انضم لآلاف المبرمجين الذين بدأوا رحلتهم معنا وأصبحوا في شركات كبرى</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold hover:shadow-xl hover:shadow-primary-500/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  سجّل الآن — مجانًا
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="font-bold gradient-text font-mono">Elmansa</span>
            <span className="text-surface-600 font-mono text-xs">{"<coding />"}</span>
          </div>
          <p className="text-surface-500 text-sm font-mono">{"// © 2024 Elmansa. All rights reserved."}</p>
        </div>
      </footer>
    </div>
  );
}
