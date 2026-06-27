import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace gsap.timeline({ scrollTrigger: { ... } }) with the mobile dual-engine logic
pattern = re.compile(r'const tl = gsap\.timeline\(\{\s*scrollTrigger:\s*(\{.*?      \}),\n    \}\);', re.DOTALL)

def repl(m):
    st_config = m.group(1)
    return """const stConfig = """ + st_config + """;
    let tl;
    if (isMobile) {
      tl = gsap.timeline({ paused: true });
      if (!window.mobileTimelines) window.mobileTimelines = [];
      window.mobileTimelines.push({ id: stConfig.trigger, tl: tl, onEnter: stConfig.onEnter });
    } else {
      tl = gsap.timeline({ scrollTrigger: stConfig });
    }"""

content = pattern.sub(repl, content)

# Remove Lenis instantiation completely on mobile
content = content.replace('const lenis = new Lenis({', 'let lenis = null;\n  if (!isMobile) {\n    lenis = new Lenis({')
content = content.replace('lenis.on("scroll", ScrollTrigger.update);', 'lenis.on("scroll", ScrollTrigger.update);\n    gsap.ticker.add((time) => lenis.raf(time * 1000));\n    gsap.ticker.lagSmoothing(0);\n    lenis.stop();\n  }')
# Remove the old ticker adds that were outside the if block
content = content.replace('gsap.ticker.add((time) => lenis.raf(time * 1000));\n  gsap.ticker.lagSmoothing(0);\n  lenis.stop(); // Don\'t scroll until intro is dismissed', '')

# Fix any `lenis.stop()` and `lenis.start()` calls
content = content.replace('lenis.stop();', 'if(lenis) lenis.stop();')
content = content.replace('lenis.start();', 'if(lenis) lenis.start();')

# Append MobileSceneManager at the end of setupAllScenes
manager_code = """
  // ── MOBILE TAP-TO-ADVANCE SCENE MANAGER ──────────────────────────────
  if (isMobile) {
    const mobileNav = document.getElementById("mobile-nav");
    const btnNext = document.getElementById("btn-next");
    const btnPrev = document.getElementById("btn-prev");
    let currentIndex = 0;

    const durations = {
      "#scene-1": 6, "#scene-2": 5, "#scene-3": 10, "#scene-4": 6,
      "#scene-5": 5, "#scene-6": 8, "#scene-whatif": 10, "#scene-7": 6,
      "#scene-8": 8, "#scene-9": 8, "#scene-10": 7, "#scene-11": 5,
      "#scene-12": 6, "#finale": 4
    };

    function playMobileScene(index) {
      // Hide all scenes
      window.mobileTimelines.forEach((scene, i) => {
        const el = document.querySelector(scene.id);
        if (el) el.classList.remove("active");
        if (i !== index) scene.tl.pause();
      });

      const current = window.mobileTimelines[index];
      if (!current) return;

      const el = document.querySelector(current.id);
      if (el) el.classList.add("active");

      if (current.onEnter) current.onEnter();

      // Reset and play
      current.tl.progress(0);
      
      // Calculate timeScale
      const dur = current.tl.duration();
      const targetSec = durations[current.id] || 5;
      if (dur > 0) current.tl.timeScale(dur / targetSec);

      current.tl.play();

      // Hide next button, show prev button if not first scene
      btnNext.classList.remove("visible");
      if (index > 0) btnPrev.classList.add("visible");
      else btnPrev.classList.remove("visible");

      // Show next button when complete
      current.tl.eventCallback("onComplete", () => {
        if (index < window.mobileTimelines.length - 1) {
          btnNext.classList.add("visible");
        }
      });
    }

    btnNext.addEventListener("click", () => {
      if (currentIndex < window.mobileTimelines.length - 1) {
        currentIndex++;
        playMobileScene(currentIndex);
      }
    });

    btnPrev.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        playMobileScene(currentIndex);
      }
    });

    // Start first scene
    setTimeout(() => {
      mobileNav.style.display = "flex";
      playMobileScene(0);
    }, 1000);
  }
}
"""

content = content.replace('setupFinale();\n  }', 'setupFinale();\n' + manager_code)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("patch3 success")
