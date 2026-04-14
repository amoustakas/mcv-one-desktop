import { aegis } from './aegis';
import { forge } from './forge';
import { ledger } from './ledger';
import { herald } from './herald';
import { oracle } from './oracle';
import { shield } from './shield';
import { scribe } from './scribe';
import { director } from './director';
import { sentinel } from './sentinel';
import type { AgentDefinition } from '../types';

export const builtinAgents: AgentDefinition[] = [
  aegis, forge, ledger, herald, oracle, shield, scribe, director, sentinel,
];

export const agentMap: Record<string, AgentDefinition> = Object.fromEntries(
  builtinAgents.map((a) => [a.id, a]),
);

export { aegis, forge, ledger, herald, oracle, shield, scribe, director, sentinel };
