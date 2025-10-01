interface Opcao {
  id: string;
  texto: string;
  proximo: string;
}

interface Capitulo {
  texto: string;
  opcoes?: Opcao[];
  isCombat?: boolean;
}

interface ParsedStory {
  capitulos: Record<string, Capitulo>;
  initialChapter: string;
}

interface Node {
  id: string;
  text: string;
  type: 'text' | 'decision' | 'combat';
}

interface Edge {
  from: string;
  to: string;
  label: string;
}

export function parseMermaidToStory(mermaidCode: string): ParsedStory {
  const lines = mermaidCode.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('flowchart'));

  const nodes = new Map<string, Node>();
  const edges: Edge[] = [];

  for (const line of lines) {
    if (line.includes('[') || line.includes('{')) {
      const nodeMatch = parseNodeLine(line);
      if (nodeMatch) {
        nodes.set(nodeMatch.id, nodeMatch);
      }
    }

    if (line.includes('-->')) {
      const edgeMatch = parseEdgeLine(line);
      if (edgeMatch) {
        edges.push(edgeMatch);
      }
    }
  }

  const capitulos: Record<string, Capitulo> = {};

  for (const [nodeId, node] of nodes.entries()) {
    const outgoingEdges = edges.filter(e => e.from === nodeId);

    const capitulo: Capitulo = {
      texto: node.text,
      isCombat: node.type === 'combat'
    };

    if (outgoingEdges.length > 0) {
      capitulo.opcoes = outgoingEdges.map((edge, index) => ({
        id: edge.label ? generateOptionId(edge.label) : `opcao${index + 1}`,
        texto: edge.label || 'Continuar',
        proximo: edge.to
      }));
    }

    capitulos[nodeId] = capitulo;
  }

  validateGraph(nodes, edges, capitulos);

  const initialChapter = findInitialChapter(nodes, edges);

  return {
    capitulos,
    initialChapter
  };
}

function parseNodeLine(line: string): Node | null {
  const textNodeRegex = /(\w+)\["(.+?)"\]/;
  const decisionNodeRegex = /(\w+)\{(.+?)\}/;
  const combatNodeRegex = /(\w+)\["\[COMBATE\]\s*(.+?)"\]/;

  let match = line.match(combatNodeRegex);
  if (match) {
    return {
      id: match[1],
      text: match[2],
      type: 'combat'
    };
  }

  match = line.match(textNodeRegex);
  if (match) {
    return {
      id: match[1],
      text: match[2],
      type: 'text'
    };
  }

  match = line.match(decisionNodeRegex);
  if (match) {
    return {
      id: match[1],
      text: match[2],
      type: 'decision'
    };
  }

  return null;
}

function parseEdgeLine(line: string): Edge | null {
  const edgeWithLabelRegex = /(\w+)\s*-->\s*\|(.+?)\|\s*(\w+)/;
  const edgeWithoutLabelRegex = /(\w+)\s*-->\s*(\w+)/;

  let match = line.match(edgeWithLabelRegex);
  if (match) {
    return {
      from: match[1],
      to: match[3],
      label: match[2].trim()
    };
  }

  match = line.match(edgeWithoutLabelRegex);
  if (match) {
    return {
      from: match[1],
      to: match[2],
      label: ''
    };
  }

  return null;
}

function generateOptionId(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

function validateGraph(nodes: Map<string, Node>, edges: Edge[], capitulos: Record<string, Capitulo>): void {
  for (const edge of edges) {
    if (!nodes.has(edge.to)) {
      throw new Error(`Nó de destino "${edge.to}" não encontrado no grafo. Referenciado por: ${edge.from}`);
    }
  }

  const orphanNodes = Array.from(nodes.keys()).filter(nodeId => {
    const hasIncoming = edges.some(e => e.to === nodeId);
    const hasOutgoing = edges.some(e => e.from === nodeId);
    return !hasIncoming && nodeId !== findInitialChapter(nodes, edges);
  });

  if (orphanNodes.length > 0 && nodes.size > 1) {
    console.warn(`Aviso: Nós órfãos detectados: ${orphanNodes.join(', ')}`);
  }
}

function findInitialChapter(nodes: Map<string, Node>, edges: Edge[]): string {
  const nodesWithIncoming = new Set(edges.map(e => e.to));

  const initialNodes = Array.from(nodes.keys()).filter(nodeId => !nodesWithIncoming.has(nodeId));

  if (initialNodes.length === 0) {
    throw new Error('Nenhum nó inicial encontrado. Verifique se há ciclos no grafo.');
  }

  if (initialNodes.length > 1) {
    console.warn(`Múltiplos nós iniciais encontrados: ${initialNodes.join(', ')}. Usando o primeiro: ${initialNodes[0]}`);
  }

  return initialNodes[0];
}
