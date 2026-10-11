


  // Seleciona todos os itens do menu
  const itensMenu = document.querySelectorAll('.pill-item');

  // Adiciona o evento de clique para cada um deles
  itensMenu.forEach(item => {
    item.addEventListener('click', function(evento) {
      // Impede o comportamento padrão do link (recarregar a página)
      evento.preventDefault();

      // Remove a classe 'active' (fundo preto) do item que estava ativo antes
      document.querySelector('.pill-item.active').classList.remove('active');

      // Adiciona a classe 'active' (fundo preto) no item que você acabou de clicar
      this.classList.add('active');
    });
  });





  



const botao = document.getElementById("botaoMusica");
const musica = document.getElementById("musica");

botao.addEventListener("click", async () => {
    if (musica.paused) {
        try {
            await musica.play();
            botao.textContent = "⏸ Pausar música";
        } catch (erro) {
            alert("Não foi possível tocar a música. Verifique o arquivo MP3.");
        }
    } else {
        musica.pause();
        botao.textContent = "▶ Tocar música";
    }
});

musica.addEventListener("ended", () => {
    botao.textContent = "▶ Tocar música";
});




