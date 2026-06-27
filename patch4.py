import re

with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to wrap the contents of touchHeartBtn.addEventListener("click", () => { ... })
# into a function runFinaleEffect() and intercept it.

# Find the start of the click handler
start_str = """    // Tap handler on heart
    touchHeartBtn.addEventListener("click", () => {
      if (finaleTriggered) return;
      finaleTriggered = true;

      // 1. Big pulse on heart
      gsap.to(glowHeart, {"""

new_start_str = """    // Tap handler on heart
    touchHeartBtn.addEventListener("click", () => {
      if (finaleTriggered) return;
      
      const clingyGame = document.getElementById("clingy-game");
      const clingyBtn = document.getElementById("clingy-btn");
      const clingyMsg = document.getElementById("clingy-msg");
      
      if (clingyGame && !clingyGame.dataset.played) {
          clingyGame.dataset.played = "true";
          clingyGame.style.display = "flex";
          gsap.to(clingyGame, { opacity: 1, duration: 0.5 });
          
          let jumps = 0;
          const messages = ["Nooooo!", "Stay a little longer pleaseee! 🥺", "Catch me if you can! 🏃💨"];
          
          const moveBtn = (e) => {
              if (jumps < 3) {
                  e.preventDefault();
                  clingyMsg.innerText = messages[jumps];
                  
                  const maxX = window.innerWidth - clingyBtn.offsetWidth - 40;
                  const maxY = window.innerHeight - clingyBtn.offsetHeight - 40;
                  // Calculate random x, y bounded by viewport
                  const newX = (Math.random() - 0.5) * maxX;
                  const newY = (Math.random() - 0.5) * maxY;
                  
                  clingyBtn.style.transform = `translate(${newX}px, ${newY}px)`;
                  jumps++;
              } else {
                  clingyBtn.removeEventListener("mouseover", moveBtn);
                  clingyBtn.removeEventListener("touchstart", moveBtn);
                  clingyMsg.innerText = "Okay fine... I'll let you go. ❤️";
                  clingyBtn.innerText = "See the end";
              }
          };
          
          clingyBtn.addEventListener("mouseover", moveBtn);
          clingyBtn.addEventListener("touchstart", moveBtn, {passive: false});
          
          clingyBtn.addEventListener("click", () => {
              if (jumps >= 3) {
                  gsap.to(clingyGame, { opacity: 0, duration: 0.5, onComplete: () => {
                      clingyGame.style.display = "none";
                      runFinaleEffect();
                  }});
              }
          });
          return;
      }
      
      runFinaleEffect();
      
      function runFinaleEffect() {
          finaleTriggered = true;

          // 1. Big pulse on heart
          gsap.to(glowHeart, {"""

content = content.replace(start_str, new_start_str)

# We also need to close the runFinaleEffect() function before the end of the click handler.
# The click handler ends at line 2091 in the original file (which is `      }, 500);\n    });`).
# We can search for the end of the `setTimeout(() => { ... }, 500);` block inside the event listener.

end_str = """        gsap.to(mainCanvas, { opacity: 0, duration: 1 });
        animationRunning = false;
      }, 500);
    });"""

new_end_str = """        gsap.to(mainCanvas, { opacity: 0, duration: 1 });
        animationRunning = false;
      }, 500);
      } // end runFinaleEffect
    });"""

content = content.replace(end_str, new_end_str)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("patch4 success")
