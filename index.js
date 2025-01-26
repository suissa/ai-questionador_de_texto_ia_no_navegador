import * as webllm from "https://esm.run/@mlc-ai/web-llm";

/*************** WebLLM logic ***************/
const messages = [
  {
    content: "You are a helpful AI agent helping users.",
    role: "system"
  }
];

const availableModels = webllm.prebuiltAppConfig.model_list.map(
  (m) => m.model_id
);
let selectedModel = "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k";

// Callback function for initializing progress
function updateEngineInitProgressCallback(report) {
  console.log("initialize", report.progress);
  document.getElementById("download-status").textContent = report.text;
}

// Create engine instance
const engine = new webllm.MLCEngine();
engine.setInitProgressCallback(updateEngineInitProgressCallback);

async function initializeWebLLMEngine() {
  document.getElementById("download-status").classList.remove("hidden");
  selectedModel = document.getElementById("model-selection").value;
  const config = {
    temperature: 1.0,
    top_p: 1
  };
  await engine.reload(selectedModel, config);
}

async function streamingGenerating(messages, onUpdate, onFinish, onError) {
  try {
    let curMessage = "";
    const completion = await engine.chat.completions.create({
      stream: true,
      messages
    });
    for await (const chunk of completion) {
      const curDelta = chunk.choices[0].delta.content;
      if (curDelta) {
        curMessage += curDelta;
      }
      onUpdate(curMessage);
    }
    const finalMessage = await engine.getMessage();
    onFinish(finalMessage);
  } catch (err) {
    onError(err);
  }
}

/*************** UI logic ***************/
function onMessageSend() {
  const input = document.getElementById("user-input").value.trim();
  const message = {
    content: input,
    role: "user"
  };
  if (input.length === 0) {
    return;
  }
  document.getElementById("send").disabled = true;

  messages.push(message);
  appendMessage(message);

  document.getElementById("user-input").value = "";
  document
    .getElementById("user-input")
    .setAttribute("placeholder", "Generating...");

  const aiMessage = {
    content: "typing...",
    role: "assistant"
  };
  appendMessage(aiMessage);

  const onFinishGenerating = (finalMessage) => {
    updateLastMessage(finalMessage);
    document.getElementById("send").disabled = false;
    engine.runtimeStatsText().then((statsText) => {
      document.getElementById("chat-stats").classList.remove("hidden");
      document.getElementById("chat-stats").textContent = statsText;
    });
  };

  streamingGenerating(
    messages,
    updateLastMessage,
    onFinishGenerating,
    console.error
  );
}

function appendMessage(message) {
  const chatBox = document.getElementById("chat-box");
  const container = document.createElement("div");
  container.classList.add("message-container");
  const newMessage = document.createElement("div");
  newMessage.classList.add("message");
  newMessage.textContent = message.content;

  if (message.role === "user") {
    container.classList.add("user");
  } else {
    container.classList.add("assistant");
  }

  container.appendChild(newMessage);
  chatBox.appendChild(container);
  chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the latest message
}

function updateLastMessage(content) {
  const messageDoms = document
    .getElementById("chat-box")
    .querySelectorAll(".message");
  const lastMessageDom = messageDoms[messageDoms.length - 1];
  lastMessageDom.textContent = content;
}

/*************** UI binding ***************/
availableModels.forEach((modelId) => {
  const option = document.createElement("option");
  option.value = modelId;
  option.textContent = modelId;
  document.getElementById("model-selection").appendChild(option);
});
document.getElementById("model-selection").value = selectedModel;
document.getElementById("download").addEventListener("click", function () {
  initializeWebLLMEngine().then(() => {
    document.getElementById("send").disabled = false;
  });
});
document.getElementById("send").addEventListener("click", function () {
  onMessageSend();
});

document.addEventListener("DOMContentLoaded", () => {

  const createTooltip = () => {
    const tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.background = '#000';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '8px';
    tooltip.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    tooltip.style.zIndex = '1000';
    tooltip.style.display = 'none';

    // Conteúdo da tooltip
    tooltip.innerHTML = `
      <label style="display: block; margin-bottom: 8px;">
        Nome da variável:
        <input type="text" id="variableInput" placeholder="Digite o nome" style="width: 200px; margin-top: 5px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
      </label>
      <button id="saveVariable" style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Salvar</button>
    `;

    document.body.appendChild(tooltip);
    return tooltip;
  };

  initializeWebLLMEngine().then(() => {
    
    const tooltip = createTooltip();
    const variableInput = tooltip.querySelector('#variableInput');
    const saveVariableButton = tooltip.querySelector('#saveVariable');
    let selectedText = '';
    let selectionRange = null;
    const variables = {}; // Armazena as variáveis criadas

    saveVariableButton.addEventListener('click', async () => {
      const variableName = variableInput.value.trim();
      console.log(variableName);
      if (variableName && selectedText) {
        // Cria um marcador para o texto selecionado
        const span = document.createElement('span');
        span.style.backgroundColor = 'lime'; // Grifador verde-limão
        span.style.color = 'black';
        span.textContent = `{{${variableName}}}`;
        console.log(selectionRange);
        // Substitui o texto selecionado pelo placeholder
        if (selectionRange) {
          
          const messages = [
            {
              content: "Você é um advogado especialista em direito do consumidor",
              role: "system"
            },
            {
              role: "user",
              content: `${variableName}
              ${selectedText}
              `
            }
          ];
          console.log(messages);
          try {
            let curMessage = "";
            const completion = await engine.chat.completions.create({
              stream: true,
              messages
            });
      
            console.log(completion);
            for await (const chunk of completion) {
              console.log(chunk);
              const curDelta = chunk.choices[0].delta.content;
              if (curDelta) {
                curMessage += curDelta;
              };
            }
            const finalMessage = await engine.getMessage();
            document.querySelector("#chat-box").textContent = finalMessage;
            console.log("final: ", finalMessage);
          } catch (err) {
            console.error(err);
          }
          
        }

        // Salva o mapeamento
        variables[variableName] = selectedText;

        console.log('Texto Original:', selectedText);
        console.log('Nome da Variável:', variableName);
        console.log('Mapeamento Atual:', variables);

        // Esconde a tooltip
        tooltip.style.display = 'none';
      } else {
        alert('Por favor, insira um nome válido para a variável.');
      }
    });
    document.addEventListener('contextmenu', async (event) => {
      event.preventDefault();
    
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        selectedText = selection.toString().trim();
        selectionRange = selection.getRangeAt(0); // Salva o intervalo da seleção
  
        // Define a posição da tooltip
        tooltip.style.left = `${event.pageX}px`;
        tooltip.style.top = `${event.pageY}px`;
        tooltip.style.display = 'block';
  
        variableInput.value = ''; // Limpa o campo de input
        variableInput.focus();
      } else {
        tooltip.style.display = 'none';
      }

      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
    
        console.log('Texto Selecionado:', selectedText);
        
      } 
    });
  })
});