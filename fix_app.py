import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"(if \(!response.ok\) throw new Error\('Network response was not ok'\);).*?(    } catch \(error\))"

replacement = r'''\g<1>

      const data = await response.json();

      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = { ...updated[lastIdx], content: data.reply };
        return updated;
      });
      
      speakText(data.reply);

      if (data.is_complete && data.extracted_data) {
        setIsChatComplete(true);
        setCvData(data.extracted_data);
      }

\g<2>'''

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replaced successfully")
