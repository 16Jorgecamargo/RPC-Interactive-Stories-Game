import { readFileSync } from 'fs';
import { join } from 'path';
import { parseMermaidToStory } from './mermaid_parser.js';

const storyPath = join(process.cwd(), 'stories', 'caverna-misteriosa.mmd');

try {
  console.log('🔍 Lendo arquivo Mermaid...');
  const mermaidCode = readFileSync(storyPath, 'utf-8');

  console.log('\n📖 Conteúdo do arquivo:');
  console.log('─'.repeat(80));
  console.log(mermaidCode);
  console.log('─'.repeat(80));

  console.log('\n⚙️  Fazendo parse...');
  const parsedStory = parseMermaidToStory(mermaidCode);

  console.log('\n✅ Parse concluído com sucesso!');
  console.log(`\n📊 Estatísticas:`);
  console.log(`  - Capítulo inicial: ${parsedStory.initialChapter}`);
  console.log(`  - Total de capítulos: ${Object.keys(parsedStory.capitulos).length}`);

  const combatChapters = Object.entries(parsedStory.capitulos).filter(([_, cap]) => cap.isCombat);
  console.log(`  - Capítulos de combate: ${combatChapters.length}`);

  console.log('\n📚 Capítulos detalhados:\n');

  for (const [id, capitulo] of Object.entries(parsedStory.capitulos)) {
    console.log(`  ${id}:`);
    console.log(`    Tipo: ${capitulo.isCombat ? '⚔️  COMBATE' : '📜 Narrativa'}`);
    console.log(`    Texto: ${capitulo.texto.substring(0, 80)}${capitulo.texto.length > 80 ? '...' : ''}`);

    if (capitulo.opcoes && capitulo.opcoes.length > 0) {
      console.log(`    Opções (${capitulo.opcoes.length}):`);
      capitulo.opcoes.forEach(op => {
        console.log(`      - [${op.id}] "${op.texto}" → ${op.proximo}`);
      });
    } else {
      console.log(`    Opções: (nenhuma - capítulo final)`);
    }
    console.log('');
  }

  console.log('\n🎯 Estrutura JSON final:');
  console.log(JSON.stringify(parsedStory, null, 2));

  console.log('\n✅ Teste concluído com sucesso!');
} catch (error) {
  console.error('\n❌ Erro ao fazer parse do arquivo:');
  console.error(error);
  process.exit(1);
}
