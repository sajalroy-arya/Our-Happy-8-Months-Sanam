import re
with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('smoothTouch: true', 'smoothTouch: false')

def repl(m):
    val = int(m.group(1))
    return 'end: isMobile ? "+=' + str(val * 2) + '%" : "+=' + str(val) + '%"'

content = re.sub(r'end:\s*\"?\+=(\d+)%\"?', repl, content)

with open('script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("success")
