import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update final-text Maneef Roy
content = content.replace(
    '<p class="final-text">Happy 8 Months, Maneef Roy.</p>',
    '<p class="final-text">Happy 8 Months, Maneef <span class="surname" style="opacity: 0; display: inline-block;">Roy.</span></p>'
)

# 2. Append new paragraph to letter
new_para = '''                    <p class="letter-body">Take a moment (read it slowly and calmly with a deep breath) for the day we met, the day destiny smiled at us, the day we shared our first laugh, the day we became Sajal, and thank the God who made us true, who made Sajal and Maneef — <span class="fire-text">SA</span><span class="ice-text">NAM</span>.</p>
'''
content = content.replace(
    '<p class="letter-body">This is just the beginning.</p>',
    '<p class="letter-body">This is just the beginning.</p>\n' + new_para
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Animate Roy later
js_replace = '''        // 5. After 3s: Final text
        setTimeout(() => {
          gsap.fromTo(
            finalText,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
          );
          gsap.fromTo(
            document.querySelector(".surname"),
            { opacity: 0, y: 15, x: -10 },
            { opacity: 1, y: 0, x: 0, duration: 1.5, ease: "power2.out", delay: 1.2 }
          );
        }, 3000);'''

js = re.sub(r'// 5\. After 3s: Final text.*?\}, 3000\);', js_replace, js, flags=re.DOTALL)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(js)

# Add CSS for fire and ice text
css_code = """
.fire-text {
  color: #ff5e00;
  text-shadow: 0 0 10px #ff5e00, 0 0 20px #ff0000;
  font-weight: 700;
}
.ice-text {
  color: #00ffff;
  text-shadow: 0 0 10px #00ffff, 0 0 20px #00a2ff;
  font-weight: 700;
}
"""
with open('style.css', 'a', encoding='utf-8') as f:
    f.write(css_code)

print('success')
