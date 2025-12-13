
      // ---------- раскрытие карточек ----------
      document.querySelectorAll("[data-card]").forEach((card) => {
        card.addEventListener("click", () => {
          card.classList.toggle("open");
        });
      });

      // ---------- логика ассистента ----------
      const assistantButton = document.getElementById("assistantButton");
      let currentThreadId = null; // одна сессия на вкладку

      const modal = document.getElementById("aiModal");
      const chatBox = document.getElementById("aiChat");
      const input = document.getElementById("aiModalInput");
      const statusLine = document.getElementById("aiModalStatus");
      const btnCancel = document.getElementById("aiModalCancel");
      const btnOk = document.getElementById("aiModalOk");

      function openModal() {
        modal.style.display = "flex";
        statusLine.textContent = "";
        statusLine.style.color = "var(--muted)";
        if (!chatBox.innerHTML.trim()) {
          // при первом открытии можно добавить приветствие-подсказку
          addAssistantMessage(
            "Привет! 👋 Я ассистент AI-BAR и могу помочь с идеями автоматизации, техническими заданиями и вопросами по ботам. Напиши, что хочешь упростить в своём бизнесе."
          );
        }
        input.focus();
      }

      function closeModal() {
        modal.style.display = "none";
      }

      function addMessage(role, text) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("ai-message");
        if (role === "user") wrapper.classList.add("ai-message-user");
        if (role === "assistant") wrapper.classList.add("ai-message-assistant");

        const label = document.createElement("div");
        label.classList.add("ai-message-label");
        label.textContent = role === "user" ? "Ты:" : "Ассистент:";

        const bubble = document.createElement("span");
        bubble.textContent = text;

        wrapper.appendChild(label);
        wrapper.appendChild(bubble);
        chatBox.appendChild(wrapper);
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      function addUserMessage(text) {
        addMessage("user", text);
      }

      function addAssistantMessage(text) {
        addMessage("assistant", text);
      }

      async function sendQuestion() {
        const userMessage = input.value.trim();
        if (!userMessage) return;

        addUserMessage(userMessage);
        input.value = "";
        statusLine.textContent = "Ассистент обрабатывает вопрос…";
        statusLine.style.color = "var(--muted)";
        btnOk.disabled = true;
        btnCancel.disabled = true;

        try {
          const response = await fetch(
            "https://ai-bar-assistant.olga-krivosheeva100.workers.dev/",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: userMessage,
                threadId: currentThreadId, // если воркер поддерживает threadId — будет диалог
              }),
            }
          );

          if (!response.ok) {
            statusLine.textContent =
              "Ассистент сейчас недоступен. Код ответа: " + response.status;
            statusLine.style.color = "var(--danger)";
            return;
          }

          const data = await response.json();
          if (data.threadId) {
            currentThreadId = data.threadId;
          }

          const reply =
            (data && (data.reply || data.answer)) ||
            JSON.stringify(data, null, 2);

          addAssistantMessage(reply);
          statusLine.textContent = "";
          statusLine.style.color = "var(--muted)";
        } catch (error) {
          statusLine.textContent =
            "Ошибка при обращении к ассистенту: " +
            (error.message || String(error));
          statusLine.style.color = "var(--danger)";
        } finally {
          btnOk.disabled = false;
          btnCancel.disabled = false;
        }
      }

      if (assistantButton) {
        assistantButton.addEventListener("click", (e) => {
          e.preventDefault();
          openModal();
        });
      }

      btnCancel.addEventListener("click", () => {
        closeModal();
      });

      btnOk.addEventListener("click", () => {
        sendQuestion();
      });

      // отправка по Ctrl+Enter
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          sendQuestion();
        }
      });
  
