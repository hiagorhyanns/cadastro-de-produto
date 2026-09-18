import React from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { 
  GraduationCap, 
  Wrench, 
  Key, 
  Database, 
  Share2, 
  Image as ImageIcon, 
  Monitor, 
  Plus, 
  Save, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  Package, 
  Lock, 
  Unlock, 
  AlertCircle,
  AlertTriangle,
  Check,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  History,
  CheckCircle2,
  HardDrive,
  Cpu,
  Wifi,
  Wind,
  MousePointer2,
  Zap,
  AlignLeft,
  Ruler,
  Eraser,
  X as XIcon,
  Search,
  UserCog,
  MessageCircle,
  LineChart as LineChartIcon,
  TrendingUp,
  Target,
  Calendar,
  PieChart,
  Activity,
  CalendarDays,
  Rocket,
  Timer,
  Lightbulb,
  BookOpen,
  HelpCircle
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { EbooksSubTab } from "./EbooksSubTab";
import { VtexBestSellersTab } from "./VtexBestSellersTab";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  getTrainingSteps, 
  saveTrainingStep, 
  deleteTrainingStep,
  getAccesses,
  saveAccess,
  deleteAccess,
  getSystemInfo,
  saveSystemInfo,
  getMonitorRecords,
  saveMonitorRecord,
  deleteMonitorRecord,
  getProductivityItems,
  saveProductivityItem,
  deleteProductivityItem,
  getProductRules,
  saveProductRule,
  deleteProductRule,
  TrainingStepData,
  AccessData,
  SystemInfoData,
  DailyRecord,
  ProductivityData,
  Improvement,
  ProductRuleData
} from "../services/firebaseService";

type SubTab = 'treinamento' | 'produto' | 'acessos' | 'erp' | 'any' | 'ftp' | 'pc' | 'monitor' | 'produtividade' | 'ebooks' | 'vtex';

const DEFAULT_PERFORMANCE_TEXT = `
# 1. Principais ajustes para melhorar o desempenho

Antes de instalar qualquer programa, faça primeiro os ajustes nativos do Windows. Eles são mais seguros e já resolvem a maior parte dos problemas de lentidão.

# 2. Verificar programas iniciando com o Windows

**Caminho no Windows 11:**
Configurações > Aplicativos > Inicialização

Desative programas que não precisam abrir junto com o computador, como Teams, Discord, Spotify, Adobe, OneDrive, Skype, atualizadores e outros aplicativos que não são usados no cadastro de produto.

Mantenha ativo apenas o que for realmente necessário para o trabalho.

# 3. Limpar arquivos temporários do Windows

**Caminho no Windows 11:**
Configurações > Sistema > Armazenamento > Arquivos temporários

Marque arquivos temporários, cache, lixeira e arquivos desnecessários. Depois clique em Remover arquivos.

Também pode usar o comando:
Win + R > digitar %temp% > Enter

Apague os arquivos temporários que o sistema permitir. Os arquivos que não puderem ser apagados podem ser ignorados.

# 4. Ativar Sensor de Armazenamento

**Caminho no Windows 11:**
Configurações > Sistema > Armazenamento > Sensor de Armazenamento

Ative o Sensor de Armazenamento para o Windows limpar arquivos temporários automaticamente e evitar acúmulo de lixo no sistema.

# 5. Verificar espaço livre no SSD

**Caminho:**
Explorador de Arquivos > Este Computador > Disco Local C:

O ideal é manter pelo menos 20% de espaço livre no SSD. Quando o disco fica quase cheio, o Windows começa a ficar lento, travar e demorar para abrir programas.

# 6. Ajustar efeitos visuais do Windows

**Caminho:**
Pesquisar no Windows > digitar “Ajustar a aparência e o desempenho do Windows”

Na janela de opções de desempenho, selecione:
Ajustar para obter um melhor desempenho

Ou use uma configuração equilibrada, mantendo apenas fontes suaves e miniaturas, caso precise visualizar imagens com mais facilidade.

# 7. Fechar programas em segundo plano

**Caminho:**
Ctrl + Shift + Esc > Gerenciador de Tarefas

Na aba Processos, veja quais programas estão consumindo muita memória, processador ou disco. Feche os programas que não são necessários no momento.

Evite deixar muitos navegadores, planilhas, imagens, ERP, marketplace e sistemas abertos ao mesmo tempo sem necessidade.

# 8. Navegador recomendado

Para cadastro de produto, o navegador mais recomendado é o **Google Chrome atualizado**, porque costuma ter melhor compatibilidade com ERP, ANY, marketplaces, Google Drive, planilhas e sistemas web.

Se o computador tiver pouca memória RAM, pode testar o **Microsoft Edge**, que geralmente consome menos memória em alguns cenários e tem boa compatibilidade com sistemas web.

Evite usar navegadores desconhecidos ou extensões desnecessárias.

# 9. Limpar cache do navegador

No Google Chrome:
Configurações > Privacidade e segurança > Excluir dados de navegação

Marque cache e cookies apenas quando necessário. Limpar cache pode ajudar quando sistemas estão lentos, travando ou carregando dados antigos.

**Atalho:**
Ctrl + Shift + Delete

# 10. Remover extensões desnecessárias do navegador

No Google Chrome:
Menu de três pontos > Extensões > Gerenciar extensões

Remova ou desative extensões que não são usadas. Muitas extensões deixam o navegador pesado e podem atrapalhar sistemas como ERP, marketplace, planilhas e ferramentas de cadastro.

# 11. Windows 10 ou Windows 11

Para computadores mais novos, com SSD e pelo menos 8GB de RAM, o **Windows 11** é recomendado por ter suporte mais atual e melhor integração com recursos recentes.

Para computadores mais antigos, com pouca memória ou processador fraco, o **Windows 10** pode ser mais leve em alguns casos, desde que ainda esteja atualizado e seguro.

# 12. Atualizar o Windows

**Caminho:**
Configurações > Windows Update > Verificar atualizações

Manter o Windows atualizado ajuda a corrigir erros, melhorar estabilidade e evitar falhas em drivers, navegador e segurança.

# 13. Verificar vírus e ameaças

**Caminho:**
Segurança do Windows > Proteção contra vírus e ameaças > Verificação rápida

Use o antivírus nativo do Windows, chamado Segurança do Windows / Microsoft Defender. Evite instalar programas desconhecidos prometendo “limpar memória” ou “aumentar desempenho”.

# 14. Programas simples e seguros para apoio

Use preferencialmente ferramentas nativas do Windows:
- Microsoft Defender para segurança.
- Limpeza de Disco do Windows para limpeza básica.
- Gerenciador de Tarefas para verificar consumo de memória e processador.
- Sensor de Armazenamento para limpeza automática.

# 15. Organização de arquivos para cadastro

Mantenha imagens, planilhas, catálogos e documentos organizados por fornecedor, marca ou data.

**Sugestão de organização:**
Fornecedor > Marca > Produto > Imagens / Catálogo / Ficha técnica

# 16. Reiniciar o computador com frequência

Reinicie o computador pelo menos algumas vezes na semana. Isso libera memória, fecha processos travados e melhora o desempenho geral.

# 17. Principal recomendação técnica

Para trabalhar com cadastro de produto:
- **Memória RAM:** mínimo 8GB, recomendado 16GB.
- **Armazenamento:** SSD de pelo menos 240GB.
- **Processador:** Intel Core i5 ou superior, de geração recente.
- **Monitor:** recomendado usar 2 monitores Full HD.
- **Internet:** conexão estável.
- **Navegador:** Google Chrome atualizado ou Microsoft Edge.
`;

const DEFAULT_ACCESSES: AccessData[] = [
  { id: 'def-sankhya', toolName: 'Sankhya ERP — acesso necessário para consultar cadastro interno, códigos, estoque, dados comerciais e informações do produto.', hasAccess: true, createdAt: 1 },
  { id: 'def-any', toolName: 'ANY Market — acesso necessário para acompanhar e revisar transmissões de produtos para marketplaces.', hasAccess: true, createdAt: 2 },
  { id: 'def-ftp', toolName: 'FTP / Banco de Imagens — acesso necessário para buscar, organizar e baixar imagens oficiais dos produtos.', hasAccess: true, createdAt: 3 },
  { id: 'def-vtex', toolName: 'VTEX Admin — acesso necessário para consultar ou revisar produtos publicados no site.', hasAccess: false, createdAt: 4 },
  { id: 'def-drive', toolName: 'Google Drive / Catálogos — acesso necessário para consultar catálogos, fichas técnicas, planilhas e materiais enviados por fornecedores.', hasAccess: true, createdAt: 5 },
];

const DEFAULT_SYSTEM_CONTENTS: Record<string, string> = {
  erp: `Sankhya é o sistema interno da empresa usado para consultar e validar informações importantes do produto antes do cadastro.

No cadastro de produto, o Sankhya pode ser usado para conferir código interno, descrição original, marca, fornecedor, estoque, unidade de venda, preço, NCM, dados comerciais e vínculos necessários para o produto seguir corretamente para o site e marketplaces.

Antes de cadastrar ou revisar um produto, confira se as informações principais estão coerentes com o fornecedor, catálogo, ficha técnica e imagens disponíveis. Se houver divergência entre ERP, catálogo e fornecedor, o ideal é sinalizar antes de publicar.

Exemplo de conferência:

- Código interno do produto.
- Nome e descrição base.
- Marca e modelo.
- Unidade de venda.
- Estoque disponível.
- Dados fiscais e comerciais.
- Se o produto está ativo para venda.
- Se há divergência entre ERP, site e marketplace.`,
  any: `ANY Market é o hub usado para gerenciar, revisar e transmitir produtos para marketplaces.

No fluxo de cadastro, o ANY ajuda a acompanhar se o produto foi enviado corretamente para canais como Mercado Livre, Magalu, Amazon, Via, entre outros marketplaces. Também pode ser usado para verificar erros de transmissão, títulos, descrições, imagens, categorias, atributos obrigatórios, preço, estoque e status do anúncio.

Pontos importantes para conferir no ANY:

- Se o produto foi integrado corretamente.
- Se o título está dentro do limite do marketplace.
- Se a descrição está adequada.
- Se as imagens foram enviadas corretamente.
- Se a categoria está correta.
- Se faltam atributos obrigatórios.
- Se existe erro de transmissão.
- Se o produto está ativo, pausado ou com pendência.
- Se preço e estoque estão sincronizados.

Quando houver erro de transmissão, o ideal é ler a mensagem retornada pelo marketplace e corrigir o cadastro na origem correta, evitando ajustes soltos sem padrão.`,
  ftp: `Como adicionar imagens no FTP / Banco de Imagens

O FTP é usado para armazenar e organizar as imagens dos produtos que serão utilizadas no cadastro do site, marketplaces e materiais internos.

Antes de subir as imagens, organize os arquivos em uma pasta com o código ou nome do produto. Use nomes claros e padronizados para facilitar a localização depois.

Exemplo de nome de imagem:

57124-1.jpg
57124-2.jpg
57124-3.jpg

Sempre que possível, use o código interno do produto no nome do arquivo. Isso evita confusão entre imagens parecidas e facilita a busca no banco de imagens.

Passo a passo básico:

1. Separar as imagens corretas do produto.
2. Conferir se as imagens pertencem ao produto certo.
3. Verificar se não há imagem duplicada, cortada, errada ou com baixa qualidade.
4. Renomear os arquivos usando o código do produto.
5. Acessar o FTP / banco de imagens.
6. Enviar as imagens para a pasta correta.
7. Conferir se o upload foi concluído.
8. Copiar o link ou caminho da imagem, quando necessário.
9. Usar as imagens no cadastro do produto, site ou marketplace.

Cuidados importantes:

- Não misturar imagens de produtos diferentes.
- Não subir imagens com nome genérico, como “imagem1”, “foto nova” ou “produto final”.
- Não usar imagem de concorrente sem validação.
- Sempre conferir se a imagem corresponde ao modelo, cor, voltagem, tamanho e versão correta do produto.
- Em caso de dúvida, validar com fornecedor, catálogo, ficha técnica ou responsável pelo cadastro.`
};

const DEFAULT_PRODUCTIVITY_ITEMS: ProductivityData[] = [
  {
    id: 'prod-1',
    title: '1. Melhorar desempenho do computador',
    description: 'Ter memória RAM adequada, SSD e computador com bom desempenho ajuda a reduzir travamentos durante o cadastro de produtos. Isso melhora o uso simultâneo de ERP, ANY Market, navegador, planilhas, catálogos e imagens.',
    note: 'Recomendado no mínimo 8GB de RAM, ideal 16GB, SSD e processador de geração recente.',
    createdAt: 1,
    icon: 'Cpu',
    completed: false
  },
  {
    id: 'prod-2',
    title: '2. Usar segundo monitor para produtividade',
    description: 'Utilizar um segundo monitor, mesmo que menor, ajuda a copiar, conferir e comparar informações com mais velocidade. Um monitor pode ficar com ERP, catálogo ou fornecedor, enquanto o outro fica com site, ANY, marketplace ou planilha.',
    note: 'Ajuda muito em telas pequenas e reduz troca de abas.',
    createdAt: 2,
    icon: 'Monitor',
    completed: false
  },
  {
    id: 'prod-3',
    title: '3. Manter FTP ativo durante o cadastro',
    description: 'Manter o FTP ou banco de imagens aberto por mais tempo durante o cadastro reduz perda de tempo procurando pastas, refazendo login ou localizando imagens novamente.',
    note: 'Organizar imagens por código do produto, fornecedor ou categoria deixa o processo mais rápido.',
    createdAt: 3,
    icon: 'Image',
    completed: false
  },
  {
    id: 'prod-4',
    title: '4. Padronizar nomes de produtos antes de transmitir',
    description: 'Revisar o nome dos produtos antes da transmissão evita erros em marketplaces. Alguns canais, como Via Varejo, podem bloquear ou reprovar títulos com palavras proibidas, termos inadequados ou informações fora do padrão.',
    note: 'Corrigir antes de transmitir evita retrabalho.',
    createdAt: 4,
    icon: 'CheckCircle2',
    completed: false
  },
  {
    id: 'prod-5',
    title: '5. Substituir termos problemáticos no título',
    description: 'Quando uma palavra puder gerar restrição, erro ou interpretação errada no marketplace, substituir por outro termo mais adequado. Exemplo: trocar “vitrine” por termos mais corretos dependendo do produto, como expositor, refrigerador expositor, balcão expositor ou outro nome técnico validado.',
    note: 'A troca deve respeitar a característica real do produto.',
    createdAt: 5,
    icon: 'Edit2',
    completed: false
  },
  {
    id: 'prod-6',
    title: '6. Separar informações antes de iniciar o cadastro',
    description: 'Antes de cadastrar, reunir catálogo, ficha técnica, imagens, medidas, peso, marca, modelo, voltagem, capacidade e diferenciais do produto. Isso evita parar o cadastro no meio do processo para procurar informação.',
    note: 'Quanto mais completo o rascunho inicial, mais rápido e seguro fica o cadastro.',
    createdAt: 6,
    icon: 'AlignLeft',
    completed: false
  },
  {
    id: 'prod-7',
    title: '7. Conferir imagens antes de subir o produto',
    description: 'Validar se as imagens pertencem ao produto correto, se não estão duplicadas, cortadas, com baixa qualidade ou divergentes em modelo, cor, tamanho ou voltagem.',
    note: 'Imagem errada gera retrabalho e pode prejudicar anúncio, site e marketplace.',
    createdAt: 7,
    icon: 'Activity',
    completed: false
  },
  {
    id: 'prod-8',
    title: '8. Revisar título, descrição e atributos antes de ativar',
    description: 'Antes de ativar o produto, conferir título, descrição, categoria, marca, modelo, medidas, peso, imagens e atributos obrigatórios. Essa revisão reduz erro de cadastro e evita correções futuras.',
    note: 'A conferência final deve ser feita antes de publicar no site ou transmitir para marketplaces.',
    createdAt: 8,
    icon: 'Zap',
    completed: false
  }
];

const DEFAULT_TRAINING_STEPS: TrainingStepData[] = [
  {
    id: 'step-1',
    name: 'Separar todas as informações do produto',
    explanation: 'Antes de iniciar o cadastro, reúna todas as informações disponíveis do produto. Separe catálogo, ficha técnica, manual, imagens, dados do fornecedor, medidas, peso, marca, modelo, voltagem, capacidade, material, cor e diferenciais. O cadastro fica mais rápido e seguro quando todas as informações estão organizadas antes de começar.',
    position: 1,
    createdAt: 1,
    imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'Antes o cadastro podia começar com informações incompletas. A melhoria é preparar um rascunho completo antes de cadastrar.' }]
  },
  {
    id: 'step-2',
    name: 'Conferir se o produto já existe no sistema',
    explanation: 'Antes de criar um novo cadastro, pesquise se o produto já existe no ERP, site, ANY Market ou marketplace. Isso evita produto duplicado, erro de integração e retrabalho. Confira pelo código interno, nome do produto, modelo, marca e SKU.',
    position: 2,
    createdAt: 2,
    imageUrl: 'https://images.unsplash.com/photo-1454165833767-027eeef15517?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é pesquisar antes de cadastrar para evitar duplicidade.' }]
  },
  {
    id: 'step-3',
    name: 'Validar dados no ERP Sankhya',
    explanation: 'Consulte o produto no Sankhya para conferir código interno, descrição base, marca, fornecedor, unidade de venda, estoque, preço, status do produto e dados comerciais. O ERP deve ser usado como fonte principal para dados internos da empresa.',
    position: 3,
    createdAt: 3,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é validar o cadastro interno antes de publicar no site ou transmitir para marketplace.' }]
  },
  {
    id: 'step-4',
    name: 'Organizar e conferir imagens do produto',
    explanation: 'Separe as imagens corretas do produto e confira se pertencem ao modelo certo. Verifique se não há imagem duplicada, cortada, errada, com baixa qualidade ou divergente em cor, voltagem, tamanho ou versão. Renomeie as imagens usando o código do produto, por exemplo: 57124-1.jpg, 57124-2.jpg e 57124-3.jpg.',
    position: 4,
    createdAt: 4,
    imageUrl: 'https://images.unsplash.com/photo-1493723843671-1d655e7d9708?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'Antes as imagens podiam ficar soltas ou sem padrão. A melhoria é organizar imagens por código do produto.' }]
  },
  {
    id: 'step-5',
    name: 'Consultar catálogo, fornecedor e concorrentes',
    explanation: 'Use o catálogo oficial, ficha técnica, manual do fornecedor e referências de concorrentes para entender melhor o produto. Concorrentes podem ajudar com termos de busca e informações comerciais, mas os dados técnicos devem ser validados com fonte confiável antes de publicar.',
    position: 5,
    createdAt: 5,
    imageUrl: 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é usar concorrentes como apoio, mas validar dados técnicos no fornecedor ou catálogo oficial.' }]
  },
  {
    id: 'step-6',
    name: 'Criar título com SEO e limite correto',
    explanation: 'Crie um título claro, pesquisável e dentro do limite exigido pelo canal. Use nome do produto, marca, modelo, voltagem e principal característica quando fizer sentido. Evite excesso de palavras, caracteres desnecessários e termos proibidos em marketplaces. Para Mercado Livre, considerar o limite de até 60 caracteres quando aplicável.',
    position: 6,
    createdAt: 6,
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é criar título pensando em busca, leitura rápida e regras dos marketplaces.' }]
  },
  {
    id: 'step-7',
    name: 'Montar descrição técnica e objetiva',
    explanation: 'Crie uma descrição com foco nas principais características técnicas do produto. Informe material, medidas, peso, capacidade, voltagem, aplicação de uso, diferenciais e cuidados importantes. Evite promessas exageradas, dados inventados ou informações que não estejam no catálogo, fornecedor ou ficha técnica.',
    position: 7,
    createdAt: 7,
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é gerar descrição mais clara, completa e otimizada para SEO, mantendo revisão obrigatória.' }]
  },
  {
    id: 'step-8',
    name: 'Preencher atributos obrigatórios',
    explanation: 'Preencha corretamente marca, modelo, voltagem, cor, tamanho, material, peso, medidas, capacidade, garantia e outros atributos exigidos pela categoria. Atributos incompletos podem impedir transmissão para marketplaces ou prejudicar a busca no site.',
    position: 8,
    createdAt: 8,
    imageUrl: 'https://images.unsplash.com/photo-1544383335-c54d19b7d56b?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é revisar atributos antes de ativar o produto para reduzir erro de transmissão.' }]
  },
  {
    id: 'step-9',
    name: 'Conferir categoria correta',
    explanation: 'Escolha a categoria correta do produto no site, ERP, ANY Market ou marketplace. Categoria errada prejudica busca, filtros, atributos obrigatórios e pode gerar reprovação em canais de venda. Compare com produtos semelhantes já cadastrados quando tiver dúvida.',
    position: 9,
    createdAt: 9,
    imageUrl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é validar categoria antes de publicar para evitar retrabalho.' }]
  },
  {
    id: 'step-10',
    name: 'Revisar palavras proibidas e termos sensíveis',
    explanation: 'Antes de transmitir para marketplaces, revise se o título ou descrição contém palavras proibidas, termos bloqueados ou expressões que possam causar reprovação. Em alguns canais, como Via Varejo, determinados termos podem gerar erro. Se necessário, substitua por um termo técnico correto, sem alterar a característica real do produto.',
    position: 10,
    createdAt: 10,
    imageUrl: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é corrigir termos problemáticos antes da transmissão.' }]
  },
  {
    id: 'step-11',
    name: 'Conferir preço, estoque e disponibilidade',
    explanation: 'Antes de ativar o produto, confira preço, estoque, disponibilidade, unidade de venda e se o produto está liberado para venda. Produto sem estoque, com preço errado ou unidade incorreta pode gerar pedido problemático e retrabalho operacional.',
    position: 11,
    createdAt: 11,
    imageUrl: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é validar dados comerciais antes da publicação.' }]
  },
  {
    id: 'step-12',
    name: 'Publicar ou transmitir o produto',
    explanation: 'Após revisar título, descrição, imagens, categoria, atributos, preço e estoque, faça a ativação no site ou transmissão pelo hub de marketplace. Acompanhe se o produto foi integrado corretamente e se retornou algum erro.',
    position: 12,
    createdAt: 12,
    imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é publicar somente depois da revisão completa.' }]
  },
  {
    id: 'step-13',
    name: 'Verificar produto publicado no site',
    explanation: 'Depois de ativar, abra a página do produto no site e confira se título, descrição, imagens, preço, estoque, variações, informações técnicas e layout estão corretos. Também verifique se a imagem principal está adequada e se a página está carregando normalmente.',
    position: 13,
    createdAt: 13,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é validar visualmente o produto publicado antes de considerar o cadastro finalizado.' }]
  },
  {
    id: 'step-14',
    name: 'Acompanhar erros no ANY Market e marketplaces',
    explanation: 'Se o produto for enviado para marketplaces, confira no ANY Market se houve erro de transmissão. Leia a mensagem de erro, identifique o campo com problema e corrija na origem correta. Evite fazer correções soltas sem padrão.',
    position: 14,
    createdAt: 14,
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é tratar erro pela causa real e não apenas tentar reenviar sem correção.' }]
  },
  {
    id: 'step-15',
    name: 'Registrar melhorias e aprendizados do processo',
    explanation: 'Sempre que encontrar uma melhoria no fluxo de cadastro, registre no treinamento. Pode ser uma nova regra de título, cuidado com imagem, palavra proibida, padrão de fornecedor, ajuste de categoria ou forma mais rápida de conferir informações. Isso ajuda novas pessoas e reduz erros futuros.',
    position: 15,
    createdAt: 15,
    imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400',
    improvements: [{ version: 'v1', detail: 'A melhoria é transformar problemas recorrentes em orientação documentada.' }]
  }
];

const formatDate = (timestamp?: number) => {
  const date = timestamp && timestamp > 0 ? new Date(timestamp) : new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function TreinamentoTab() {
  const [activeSubTab, setActiveSubTab] = React.useState<SubTab>('treinamento');
  
  // States for each section
  const [steps, setSteps] = React.useState<TrainingStepData[]>([]);
  const [accesses, setAccesses] = React.useState<AccessData[]>([]);
  const [systemInfo, setSystemInfo] = React.useState<Record<string, SystemInfoData | null>>({});
  const [monitorRecords, setMonitorRecords] = React.useState<DailyRecord[]>([]);
  const [productivityItems, setProductivityItems] = React.useState<ProductivityData[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // CRUD states
  const [editingStep, setEditingStep] = React.useState<TrainingStepData | null>(null);
  const [editingAccess, setEditingAccess] = React.useState<AccessData | null>(null);
  const [editingSystem, setEditingSystem] = React.useState<SystemInfoData | null>(null);
  const [editingRecord, setEditingRecord] = React.useState<DailyRecord | null>(null);
  const [editingProductivity, setEditingProductivity] = React.useState<ProductivityData | null>(null);

  // States for 'Produto' Tab
  const [productRules, setProductRules] = React.useState<ProductRuleData[]>([]);
  const [generalRule, setGeneralRule] = React.useState<ProductRuleData>({
    id: 'general-rules',
    name: 'Regras gerais para todos os produtos',
    requiredInfo: '',
    forbiddenInfo: '',
    createdAt: 0
  });
  const [editingRule, setEditingRule] = React.useState<ProductRuleData | null>(null);
  const [showImageModal, setShowImageModal] = React.useState(false);
  const [imageUrlInput, setImageUrlInput] = React.useState('');
  const [productSearch, setProductSearch] = React.useState('');
  const [newInfoText, setNewInfoText] = React.useState('');

  const handleAddInfoItem = () => {
    if (!newInfoText.trim() || !editingRule) return;
    const currentItems = editingRule.requiredInfo ? editingRule.requiredInfo.split('\n').filter(Boolean) : [];
    const updatedItems = [...currentItems, newInfoText.trim()];
    setEditingRule({
      ...editingRule,
      requiredInfo: updatedItems.join('\n')
    });
    setNewInfoText('');
  };

  const handleDeleteInfoItem = (indexToDelete: number) => {
    if (!editingRule) return;
    const currentItems = editingRule.requiredInfo ? editingRule.requiredInfo.split('\n').filter(Boolean) : [];
    const updatedItems = currentItems.filter((_, idx) => idx !== indexToDelete);
    setEditingRule({
      ...editingRule,
      requiredInfo: updatedItems.join('\n')
    });
  };

  // Monitor form state
  const [newRecord, setNewRecord] = React.useState({
    date: new Date().toISOString().split('T')[0],
    quantity: 0,
    note: ''
  });
  
  // UI states
  const [expandedImprovements, setExpandedImprovements] = React.useState<Record<string, boolean>>({});
  const [pcChecks, setPcChecks] = React.useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('treinamento_pc_checks');
    return saved ? JSON.parse(saved) : {};
  });

  const [performanceContent, setPerformanceContent] = React.useState<string>(() => {
    const saved = localStorage.getItem('treinamento_performance_content');
    return saved ?? DEFAULT_PERFORMANCE_TEXT;
  });
  const [showPerformanceModal, setShowPerformanceModal] = React.useState(false);
  const [isEditingPerformance, setIsEditingPerformance] = React.useState(false);
  const [tempPerformanceContent, setTempPerformanceContent] = React.useState(performanceContent);

  React.useEffect(() => {
    localStorage.setItem('treinamento_pc_checks', JSON.stringify(pcChecks));
  }, [pcChecks]);

  React.useEffect(() => {
    localStorage.setItem('treinamento_performance_content', performanceContent);
  }, [performanceContent]);

  const handleSavePerformance = () => {
    setPerformanceContent(tempPerformanceContent);
    setIsEditingPerformance(false);
  };

  const togglePcCheck = (id: string) => {
    setPcChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stepsData, accessesData, monitorData, productivityData, productRulesData] = await Promise.all([
        getTrainingSteps(),
        getAccesses(),
        getMonitorRecords(),
        getProductivityItems(),
        getProductRules()
      ]);

      // Simple unique filter function
      const getUnique = <T extends { id: string }>(arr: T[]): T[] => {
        const seen = new Set<string>();
        return arr.filter(item => {
          if (!item.id || seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      };
      
      // Merge Training Steps
      let finalSteps = [...stepsData];
      DEFAULT_TRAINING_STEPS.forEach(defaultStep => {
        if (!finalSteps.some(s => s.id === defaultStep.id || s.name === defaultStep.name)) {
          finalSteps.push(defaultStep);
        }
      });
      setSteps(getUnique(finalSteps).sort((a, b) => a.position - b.position));
      
      setMonitorRecords(getUnique(monitorData));

      // Product Rules
      const customRules = productRulesData.filter(r => r.id !== 'general-rules');
      const genRule = productRulesData.find(r => r.id === 'general-rules') || {
        id: 'general-rules',
        name: 'Regras gerais para todos os produtos',
        requiredInfo: '',
        forbiddenInfo: '',
        createdAt: 0
      };
      setProductRules(getUnique(customRules));
      setGeneralRule(genRule);
      
      // Accesses
      if (accessesData.length === 0) {
        setAccesses(getUnique(DEFAULT_ACCESSES));
      } else {
        setAccesses(getUnique(accessesData));
      }

      // Merge Productivity Items
      let finalProductivity = [...productivityData];
      DEFAULT_PRODUCTIVITY_ITEMS.forEach(defaultItem => {
        if (!finalProductivity.some(item => item.id === defaultItem.id || item.title === defaultItem.title)) {
          finalProductivity.push(defaultItem);
        }
      });
      setProductivityItems(getUnique(finalProductivity).map(item => ({
        ...item,
        completed: !!item.completed
      })));
      
      const systems = ['erp', 'any', 'ftp'];
      const systemData: Record<string, SystemInfoData | null> = {};
      await Promise.all(systems.map(async (id) => {
        const data = await getSystemInfo(id);
        if (!data && (id === 'erp' || id === 'any' || id === 'ftp')) {
          const defaults = {
            erp: { 
              title: 'ERP (Sankhya)', 
              exp: 'O Sankhya é usado para consultar e organizar informações internas do produto, dados comerciais, códigos, estoque, cadastro.' 
            },
            any: { 
              title: 'HUB / ANY Market', 
              exp: 'O ANY Market é usado para gerenciar, revisar e transmitir produtos para marketplaces.' 
            },
            ftp: { 
              title: 'Banco de imagem', 
              exp: 'O FTP/banco de imagem é usado para armazenar, organizar e localizar imagens dos produtos para uso no cadastro, anúncios, marketplaces, site e materiais internos.' 
            }
          }[id as 'erp' | 'any' | 'ftp'];
          
          systemData[id] = {
            id,
            title: defaults.title,
            explanation: defaults.exp,
            content: DEFAULT_SYSTEM_CONTENTS[id],
            lastUpdated: Date.now()
          };
        } else {
          systemData[id] = data;
        }
      }));
      setSystemInfo(systemData);
    } catch (error) {
      console.error("Error fetching training data:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStep = () => {
    const nextPos = steps.length > 0 ? Math.max(...steps.map(s => s.position)) + 1 : 1;
    setEditingStep({
      id: '',
      name: '',
      explanation: '',
      position: nextPos,
      createdAt: Date.now(),
      improvements: []
    });
  };

  const handleSaveStep = async () => {
    if (!editingStep) return;
    
    // Auto-organize positions if duplicate
    let updatedSteps = [...steps];
    const existingIndex = updatedSteps.findIndex(s => s.id === editingStep.id);
    
    if (existingIndex > -1) {
      updatedSteps[existingIndex] = editingStep;
    } else {
      updatedSteps.push({ ...editingStep, id: Math.random().toString(36).substr(2, 9) });
    }
    
    // Sort and re-index positions to be clean
    updatedSteps.sort((a, b) => a.position - b.position);
    updatedSteps = updatedSteps.map((s, i) => ({ ...s, position: i + 1 }));
    
    try {
      await Promise.all(updatedSteps.map(s => saveTrainingStep(s)));
      setSteps(updatedSteps);
      setEditingStep(null);
    } catch (error) {
      alert("Erro ao salvar passo a passo.");
    }
  };

  const handleDeleteStep = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este passo?")) return;
    try {
      await deleteTrainingStep(id);
      const updated = steps.filter(s => s.id !== id).map((s, i) => ({ ...s, position: i + 1 }));
      await Promise.all(updated.map(s => saveTrainingStep(s)));
      setSteps(updated);
    } catch (error) {
      alert("Erro ao excluir passo.");
    }
  };

  const handleReorderSteps = async (newOrder: TrainingStepData[]) => {
    const updated = newOrder.map((s, i) => ({ ...s, position: i + 1 }));
    setSteps(updated);
    try {
      await Promise.all(updated.map(s => saveTrainingStep(s)));
    } catch (error) {
      console.error("Error saving new order:", error);
    }
  };

  const handleAddImprovement = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    const improvements = step.improvements || [];
    const newVersion = `v${improvements.length + 1}`;
    const newImprovement: Improvement = { version: newVersion, detail: '' };
    
    const updatedStep = { ...step, improvements: [...improvements, newImprovement] };
    setEditingStep(updatedStep);
    // Open prompt or inline edit for the newly added improvement
  };

  // Accesses handlers
  const handleAddAccess = () => {
    setEditingAccess({
      id: '',
      toolName: '',
      hasAccess: false,
      createdAt: Date.now()
    });
  };

  const handleSaveAccess = async () => {
    if (!editingAccess) return;
    try {
      const saved = await saveAccess(editingAccess);
      if (saved) {
        setAccesses(prev => {
          const exists = prev.find(a => a.id === saved.id);
          if (exists) return prev.map(a => a.id === saved.id ? saved : a);
          return [...prev, saved];
        });
      }
      setEditingAccess(null);
    } catch (error) {
      alert("Erro ao salvar acesso.");
    }
  };

  const toggleAccess = async (access: AccessData) => {
    const updated = { ...access, hasAccess: !access.hasAccess };
    try {
      await saveAccess(updated);
      setAccesses(prev => prev.map(a => a.id === access.id ? updated : a));
    } catch (error) {
      console.error("Error toggling access:", error);
    }
  };

  // System handlers
  const handleEditSystem = (id: string, defaultTitle: string, defaultExp: string) => {
    const existing = systemInfo[id];
    setEditingSystem(existing || {
      id,
      title: defaultTitle,
      explanation: defaultExp,
      content: '',
      lastUpdated: Date.now()
    });
  };

  const handleSaveSystem = async () => {
    if (!editingSystem) return;
    try {
      const saved = await saveSystemInfo({ ...editingSystem, lastUpdated: Date.now() });
      if (saved) {
        setSystemInfo(prev => ({ ...prev, [saved.id]: saved }));
      }
      setEditingSystem(null);
    } catch (error) {
      alert("Erro ao salvar informações do sistema.");
    }
  };

  // Monitor Handlers
  const handleSaveMonitorRecord = async () => {
    if (!newRecord.date || newRecord.quantity < 0) {
      alert("Por favor, preencha a data e a quantidade corretamente.");
      return;
    }

    const existing = monitorRecords.find(r => r.date === newRecord.date);
    if (existing) {
      if (!confirm("Já existe um registro para esta data. Deseja atualizar o registro existente?")) {
        return;
      }
    }

    const record: DailyRecord = {
      id: existing?.id || '',
      ...newRecord,
      createdAt: existing?.createdAt || Date.now()
    };

    try {
      const saved = await saveMonitorRecord(record);
      if (saved) {
        setMonitorRecords(prev => {
          const index = prev.findIndex(r => r.id === saved.id);
          if (index > -1) {
            const updated = [...prev];
            updated[index] = saved;
            return updated;
          }
          return [saved, ...prev];
        });
        setNewRecord({ date: new Date().toISOString().split('T')[0], quantity: 0, note: '' });
        setEditingRecord(null);
      }
    } catch (error) {
      alert("Erro ao salvar registro de monitoramento.");
    }
  };

  const validatePassword = () => {
    const pass = prompt("Informe a senha para autorizar esta ação:");
    if (pass === 'betebete55') return true;
    alert("Senha incorreta. A edição ou exclusão não foi autorizada.");
    return false;
  };

  const handleEditRecord = (record: DailyRecord) => {
    if (!validatePassword()) return;
    setEditingRecord(record);
    setNewRecord({
      date: record.date,
      quantity: record.quantity,
      note: record.note
    });
    // Scroll to form or just set it
    document.getElementById('monitor-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteRecord = async (id: string) => {
    if (!validatePassword()) return;
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      await deleteMonitorRecord(id);
      setMonitorRecords(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      alert("Erro ao excluir registro.");
    }
  };

  // Productivity Handlers
  const handleAddProductivity = () => {
    setEditingProductivity({
      id: '',
      title: '',
      description: '',
      note: '',
      icon: 'Zap',
      completed: false,
      createdAt: Date.now()
    });
  };

  const handleSaveProductivity = async () => {
    if (!editingProductivity) return;
    if (!editingProductivity.title || !editingProductivity.description) {
      alert("Por favor, preencha o título e a descrição.");
      return;
    }

    try {
      const saved = await saveProductivityItem(editingProductivity);
      if (saved) {
        setProductivityItems(prev => {
          const index = prev.findIndex(p => p.id === saved.id);
          if (index > -1) {
            const updated = [...prev];
            updated[index] = saved;
            return updated;
          }
          return [...prev, saved];
        });
        setEditingProductivity(null);
      }
    } catch (error) {
      alert("Erro ao salvar melhoria de produtividade.");
    }
  };

  const handleDeleteProductivity = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta melhoria?")) return;
    try {
      await deleteProductivityItem(id);
      setProductivityItems(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      alert("Erro ao excluir melhoria.");
    }
  };

  const handleToggleProductivityCompletion = async (item: ProductivityData) => {
    const updated = { ...item, completed: !item.completed };
    try {
      setProductivityItems(prev => prev.map(p => p.id === item.id ? updated : p));
      await saveProductivityItem(updated);
    } catch (error) {
      console.error("Error toggling productivity completion:", error);
      // Revert state on error? Maybe just log for now as per previous patterns
    }
  };

  // Product tab handlers
  const handleCreateRule = () => {
    setEditingRule({
      id: Math.random().toString(36).substring(2, 11),
      name: '',
      requiredInfo: '',
      forbiddenInfo: '',
      imageUrl: '',
      createdAt: Date.now()
    });
  };

  const handleEditRule = (rule: ProductRuleData) => {
    setEditingRule({ ...rule });
  };

  const handleEditGeneralRule = () => {
    setEditingRule({ 
      id: 'general-rules',
      name: 'Regras gerais para todos os produtos',
      requiredInfo: generalRule.requiredInfo || '',
      forbiddenInfo: generalRule.forbiddenInfo || '',
      createdAt: generalRule.createdAt || Date.now()
    });
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    
    // Validate
    if (editingRule.id !== 'general-rules' && !editingRule.name.trim()) {
      alert("Por favor, preencha o nome do produto.");
      return;
    }

    try {
      await saveProductRule(editingRule);
      if (editingRule.id === 'general-rules') {
        setGeneralRule(editingRule);
      } else {
        setProductRules(prev => {
          const idx = prev.findIndex(r => r.id === editingRule.id);
          if (idx > -1) {
            const updated = [...prev];
            updated[idx] = editingRule;
            return updated;
          } else {
            return [editingRule, ...prev];
          }
        });
      }
      setEditingRule(null);
    } catch (e) {
      console.error("Erro ao salvar regra do produto:", e);
      alert("Ocorreu um erro ao salvar o card. Tente novamente.");
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteProductRule(deleteConfirmId);
      setProductRules(prev => prev.filter(r => r.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch (e) {
      console.error("Erro ao deletar regra de produto:", e);
      alert("Erro ao excluir. Tente novamente.");
    }
  };

  const handleOpenImageModal = () => {
    setImageUrlInput(editingRule?.imageUrl || '');
    setShowImageModal(true);
  };

  const handleSaveImageLink = () => {
    if (editingRule) {
      setEditingRule({ ...editingRule, imageUrl: imageUrlInput });
    }
    setShowImageModal(false);
  };

  const filteredProductRules = productRules.filter(rule => 
    rule.name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const isSearching = productSearch.trim().length > 0;

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
      {/* Sidebar Menu */}
      <aside className="w-full md:w-64 shrink-0">
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white pt-0 pb-4 py-0">
          <div className="bg-blue-600 p-4">
            <h3 className="text-white font-black uppercase tracking-tighter text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Treinamento
            </h3>
          </div>
          <CardContent className="p-2 space-y-1">
            {[
              { id: 'treinamento', label: 'Treinamento completo', icon: GraduationCap },
              { id: 'produto', label: 'Dúvidas dos clientes', icon: HelpCircle },
              { id: 'vtex', label: 'Mais vendido VTEX', icon: TrendingUp },
              { id: 'ebooks', label: 'Guias Ebook', icon: BookOpen },
              { id: 'pc', label: 'Configuração de PC', icon: Monitor },
              { id: 'acessos', label: 'Acessos', icon: Key },
              { id: 'erp', label: 'ERP (Sankhya)', icon: Database },
              { id: 'any', label: 'ANY (Marketplace)', icon: Share2 },
              { id: 'ftp', label: 'FTP (Imagens)', icon: ImageIcon },
              { id: 'monitor', label: 'Monitor', icon: LineChartIcon },
              { id: 'produtividade', label: 'Produtividade', icon: Rocket },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as SubTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all ${
                  activeSubTab === item.id 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeSubTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </CardContent>
        </Card>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1">
        <div className="h-full pr-4">
          <AnimatePresence mode="wait">
            {activeSubTab === 'treinamento' && (
              <motion.div 
                key="training"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cadastro de produtos</h2>
                    <p className="text-sm text-slate-500 font-medium">Boas práticas, reciclagem ou melhorias</p>
                  </div>
                  <Button 
                    onClick={handleCreateStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Criar card de passo a passo
                  </Button>
                </div>

                <Reorder.Group axis="y" values={steps} onReorder={handleReorderSteps} className="space-y-4">
                  {steps.map((step) => (
                    <Reorder.Item key={step.id} value={step} className="focus:outline-none">
                      <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
                        <div className="p-4 md:p-6 flex gap-6">
                          {/* Drag Handle & Position Indicator */}
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs ring-4 ring-blue-50">
                               {step.position}
                             </div>
                             <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">PASSO</div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight">{step.name}</h3>
                                {step.imageUrl && (
                                  <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 overflow-hidden max-w-sm">
                                    <img 
                                      src={step.imageUrl} 
                                      alt={step.name} 
                                      className="w-full h-auto object-cover max-h-48"
                                      onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" onClick={() => setEditingStep(step)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteStep(step.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{step.explanation}</p>

                            {/* Improvements Section */}
                            <div className="pt-4 border-t border-slate-50 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <History className="w-4 h-4 text-blue-600" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Histórico de Melhorias</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setExpandedImprovements(prev => ({ ...prev, [step.id]: !prev[step.id] }))}
                                  className="h-7 text-xs font-bold text-blue-600 hover:bg-blue-50"
                                >
                                  {expandedImprovements[step.id] ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                                  {expandedImprovements[step.id] ? 'Recolher' : 'Ver Histórico'}
                                </Button>
                              </div>

                              <AnimatePresence>
                                {expandedImprovements[step.id] && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden space-y-2"
                                  >
                                    {(step.improvements || []).length === 0 ? (
                                      <p className="text-[10px] text-slate-400 italic">Nenhuma melhoria registrada ainda.</p>
                                    ) : (
                                      step.improvements?.map((imp, idx) => (
                                        <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-3">
                                          <Badge className="bg-white border-slate-200 text-slate-600 font-bold uppercase tracking-tight text-[10px] shrink-0">
                                            {imp.version}
                                          </Badge>
                                          <p className="text-xs text-slate-500 font-medium leading-relaxed">{imp.detail}</p>
                                        </div>
                                      ))
                                    )}
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => setEditingStep({ ...step, improvements: [...(step.improvements || []), { version: `v${(step.improvements || []).length + 1}`, detail: '' }] })}
                                      className="w-full h-8 border-dashed border-2 border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all text-[10px] font-black uppercase"
                                    >
                                      <Plus className="w-3 h-3 mr-1" /> Registrar Melhoria
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </motion.div>
            )}

            {activeSubTab === 'produto' && (
              <motion.div 
                key="produto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Informações produto tem que ter</h2>
                    <p className="text-sm text-slate-500 font-medium">Orientações de cadastro obrigatórias e proibidas por tipo de produto</p>
                  </div>
                  <Button 
                    onClick={handleCreateRule}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg shadow-md shadow-blue-100 flex items-center gap-2 shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar card
                  </Button>
                </div>

                {/* Box de Pesquisa */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Pesquisar produto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10 h-11 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 font-medium w-full"
                  />
                </div>



                {/* Custom Cards list or Search Results */}
                {isSearching ? (
                  filteredProductRules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm max-w-md mx-auto space-y-4 my-8">
                      <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900">Produto não encontrado</h3>
                      </div>
                      <Button
                        onClick={handleCreateRule}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-lg shadow-sm"
                      >
                        Cadastrar produto
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredProductRules.map((rule) => (
                        <Card key={rule.id} className="border-none shadow-sm h-full bg-white rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
                          <div className="p-4 space-y-2">
                            {/* Product Info main row */}
                            <div className="flex gap-4 items-start">
                              <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                {rule.imageUrl ? (
                                  <img 
                                    src={rule.imageUrl} 
                                    alt={rule.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 py-1">
                                <h3 className="text-base font-bold text-slate-900 leading-tight truncate">{rule.name}</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">{formatDate(rule.createdAt)}</p>
                              </div>
                            </div>

                            {/* Data listings */}
                            <div className="space-y-1.5">
                              {/* Required Info */}
                              <div className="p-2.5 bg-emerald-50/10 rounded-lg border border-emerald-100/20 space-y-1.5 border-none">
                                <div className="space-y-1">
                                  {rule.requiredInfo ? (
                                    rule.requiredInfo.split('\n').filter(Boolean).map((line, idx) => (
                                      <div key={`filtered-${rule.id}-${idx}`} className="flex items-start gap-1.5 text-xs text-slate-600 font-medium leading-relaxed">
                                        <span className="text-emerald-500 font-extrabold select-none">•</span>
                                        <span className="break-words flex-1">{line}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400 italic font-medium">Nenhuma informação cadastrada</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Actions row */}
                          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/40 flex items-center justify-end gap-3 rounded-b-xl">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditRule(rule)}
                              className="text-slate-500 hover:text-slate-900 text-xs font-bold"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteConfirmId(rule.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  // Normal behavior when not searching
                  productRules.length === 0 ? (
                    <div className="bg-slate-50/40 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
                      <Package className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-slate-500 font-medium text-sm">
                        Nenhum produto cadastrado ainda. Clique em ‘Adicionar card’ para criar o primeiro.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {productRules.map((rule) => (
                        <Card key={rule.id} className="border-none shadow-sm h-full bg-white rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
                          <div className="p-4 space-y-2">
                            {/* Product Info main row */}
                            <div className="flex gap-4 items-start">
                              <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                {rule.imageUrl ? (
                                  <img 
                                    src={rule.imageUrl} 
                                    alt={rule.name} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 py-1">
                                <h3 className="text-base font-bold text-slate-900 leading-tight truncate">{rule.name}</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1">{formatDate(rule.createdAt)}</p>
                              </div>
                            </div>

                            {/* Data listings */}
                            <div className="space-y-1.5">
                              {/* Required Info */}
                              <div className="p-2.5 bg-emerald-50/10 rounded-lg border border-emerald-100/20 space-y-1.5 border-none">
                                <div className="space-y-1">
                                  {rule.requiredInfo ? (
                                    rule.requiredInfo.split('\n').filter(Boolean).map((line, idx) => (
                                      <div key={`normal-${rule.id}-${idx}`} className="flex items-start gap-1.5 text-xs text-slate-600 font-medium leading-relaxed">
                                        <span className="text-emerald-500 font-extrabold select-none">•</span>
                                        <span className="break-words flex-1">{line}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400 italic font-medium">Nenhuma informação cadastrada</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Actions row */}
                          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/40 flex items-center justify-end gap-3 rounded-b-xl">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditRule(rule)}
                              className="text-slate-500 hover:text-slate-900 text-xs font-bold"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setDeleteConfirmId(rule.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )
                )}
              </motion.div>
            )}

            {activeSubTab === 'acessos' && (
              <motion.div 
                key="access"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Controle de Acessos</h2>
                    <p className="text-sm text-slate-500 font-medium">Sistemas e ferramentas que precisam de liberação</p>
                  </div>
                  <Button 
                    onClick={handleAddAccess}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar acesso
                  </Button>
                </div>

                <Card className="border-none shadow-sm overflow-hidden bg-white">
                  <div className="divide-y divide-slate-100">
                    {accesses.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Key className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm font-medium">Nenhum acesso cadastrado.</p>
                      </div>
                    ) : (
                      accesses.map((access) => (
                        <div key={access.id} className="p-4 flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${access.hasAccess ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                              {access.hasAccess ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </div>
                            <div>
                               <h4 className="font-bold text-slate-900">{access.toolName}</h4>
                               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                 {access.hasAccess ? "Acesso liberado" : "Aguardando liberação"}
                               </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => toggleAccess(access)}
                               className={`rounded-full ${access.hasAccess ? 'text-green-600 hover:bg-green-100' : 'text-orange-600 hover:bg-orange-100'}`}
                             >
                               {access.hasAccess ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                             </Button>
                             <div className="w-[1px] h-4 bg-slate-100 mx-1" />
                             <Button variant="ghost" size="icon" onClick={() => setEditingAccess(access)} className="w-8 h-8 text-slate-400 hover:text-blue-600">
                               <Edit2 className="w-4 h-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => deleteAccess(access.id).then(() => setAccesses(prev => prev.filter(a => a.id !== access.id)))} className="w-8 h-8 text-slate-400 hover:text-red-600">
                               <Trash2 className="w-4 h-4" />
                             </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {['erp', 'any', 'ftp'].includes(activeSubTab) && (
              <motion.div 
                key={activeSubTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {(() => {
                  const data = systemInfo[activeSubTab];
                  const defaults = {
                    erp: { 
                      title: 'ERP (Sankhya)', 
                      exp: 'O Sankhya é usado para consultar e organizar informações internas do produto, dados comerciais, códigos, estoque, cadastro, vínculos e informações necessárias para o processo de cadastro.' 
                    },
                    any: { 
                      title: 'HUB / ANY Market', 
                      exp: 'O ANY Market é usado para gerenciar, revisar e transmitir produtos para marketplaces. Acompanha se o produto foi enviado corretamente para os canais de venda.' 
                    },
                    ftp: { 
                      title: 'Banco de imagem', 
                      exp: 'O FTP/banco de imagem é usado para armazenar, organizar e localizar imagens dos produtos para uso no cadastro, anúncios, marketplaces, site e materiais internos. Imagens bem organizadas ajudam a evitar erro de cadastro.' 
                    }
                  }[activeSubTab as 'erp' | 'any' | 'ftp'];

                  return (
                    <div className="space-y-8">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{defaults.title}</h2>
                          <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                            {defaults.exp}
                          </p>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-3">
                          <Button 
                            onClick={() => handleEditSystem(activeSubTab, defaults.title, defaults.exp)}
                            variant="outline"
                            className="h-11 border-blue-200 text-blue-600 font-bold px-6 shadow-sm"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            {data ? 'Editar Conteúdo' : 'Adicionar Conteúdo'}
                          </Button>
                        </div>
                      </div>

                      {data ? (
                        <Card className="border-none shadow-xl overflow-hidden bg-white">
                          <CardContent className="p-8 space-y-6">
                             <div className="prose prose-slate max-w-none">
                                <div className="text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">
                                   {data.content || "Nenhum conteúdo cadastrado ainda. Clique em Editar para adicionar textos e links."}
                                </div>
                             </div>

                             {/* Automatic Image Previews from content */}
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {data.content.match(/\bhttps?:\/\/\S+\.(png|jpg|jpeg|gif|webp)\b/gi)?.map((url, i) => (
                                  <div key={i} className="aspect-video rounded-lg border border-slate-100 overflow-hidden shadow-sm group relative">
                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-slate-900">
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    </div>
                                  </div>
                                ))}
                             </div>

                             <div className="pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                <span>Sistema: {activeSubTab.toUpperCase()}</span>
                                <span>Última atualização: {new Date(data.lastUpdated).toLocaleString('pt-BR')}</span>
                             </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="h-60 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                          <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                          <p className="font-bold">Ainda não há conteúdo para este sistema.</p>
                          <p className="text-xs uppercase tracking-widest mt-1">Clique no botão "Adicionar Conteúdo" acima.</p>
                        </div>
                      )}

                      {activeSubTab === 'ftp' && (
                        <div className="flex flex-col gap-4 pt-6 border-t border-slate-50">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                               Precisa de acesso ao FTP? Entre em contato com o responsável abaixo.
                             </span>
                          </div>
                          <div className="flex flex-col md:flex-row items-center gap-4">
                            <a 
                              href="https://wa.me/27999795522" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-green-300 group w-full md:w-auto"
                            >
                              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 group-hover:bg-green-600 group-hover:text-white transition-all shadow-inner">
                                <MessageCircle className="w-5 h-5" />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-black text-slate-900 uppercase tracking-tight text-[11px]">Perdi acesso</h4>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Solicitar acesso com TI</p>
                                <p className="text-[8px] text-green-600 font-bold uppercase tracking-tight pt-0.5">Clique para abrir o WhatsApp</p>
                              </div>
                            </a>
                            <a 
                              href="https://wa.me/27996691154" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-green-300 group w-full md:w-auto"
                            >
                              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 group-hover:bg-green-600 group-hover:text-white transition-all shadow-inner">
                                <MessageCircle className="w-5 h-5" />
                              </div>
                              <div className="space-y-0.5">
                                <h4 className="font-black text-slate-900 uppercase tracking-tight text-[11px]">Perdi acesso</h4>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none">Solicitar acesso com Cadastro</p>
                                <p className="text-[8px] text-green-600 font-bold uppercase tracking-tight pt-0.5">Clique para abrir o WhatsApp</p>
                              </div>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {activeSubTab === 'monitor' && (
              <motion.div 
                key="monitor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pb-12"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Monitor de Ativação</h2>
                  <p className="text-sm text-slate-500 font-medium">Acompanhamento diário de produtos ativados</p>
                </div>

                {/* Summary Cards */}
                {(() => {
                  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
                  const monthRecords = monitorRecords.filter(r => r.date.startsWith(currentMonth));
                  const totalActivated = monthRecords.reduce((acc, r) => acc + Number(r.quantity), 0);
                  const daysInMonth = monthRecords.length;
                  const avgDaily = daysInMonth > 0 ? (totalActivated / daysInMonth).toFixed(1) : "0";
                  const daysAboveGoal = monthRecords.filter(r => r.quantity >= 4).length;
                  const daysBelowGoal = monthRecords.filter(r => r.quantity < 4).length;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <Card className="border-none shadow-sm bg-blue-600 text-white">
                        <CardContent className="p-4 flex flex-col gap-1">
                          <div className="flex items-center gap-2 opacity-80">
                            <Activity className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Total no mês</span>
                          </div>
                          <div className="text-2xl font-black">{totalActivated}</div>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Média diária</span>
                          </div>
                          <div className="text-2xl font-black text-slate-900">{avgDaily}</div>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Meta diária</span>
                          </div>
                          <div className="text-2xl font-black text-slate-900">4</div>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Acima da meta</span>
                          </div>
                          <div className="text-2xl font-black text-green-600">{daysAboveGoal} <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">dias</span></div>
                        </CardContent>
                      </Card>
                      <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-4 flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400">
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Abaixo da meta</span>
                          </div>
                          <div className="text-2xl font-black text-orange-600">{daysBelowGoal} <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">dias</span></div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

                {/* Graph Area */}
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-4">
                    <div>
                      <CardTitle className="text-sm font-black uppercase tracking-tight">Atividade do Mês</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Realizado vs Meta (4/dia)</CardDescription>
                    </div>
                    <CalendarDays className="w-5 h-5 text-slate-300" />
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[300px] w-full">
                      {(() => {
                        const currentMonth = new Date().toISOString().slice(0, 7);
                        const data = monitorRecords
                          .filter(r => r.date.startsWith(currentMonth))
                          .sort((a, b) => a.date.localeCompare(b.date))
                          .map(r => ({
                            name: new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit' }),
                            quantidade: r.quantity,
                            meta: 4
                          }));

                        if (data.length === 0) {
                          return (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                              <PieChart className="w-10 h-10 opacity-20" />
                              <p className="font-bold text-sm">Ainda não há registros de produtos ativados neste mês.</p>
                              <p className="text-[10px] uppercase font-black tracking-widest">Cadastre o primeiro registro para iniciar o monitoramento.</p>
                            </div>
                          );
                        }

                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" fontSize={10} fontWeight="bold" stroke="#94a3b8" tickLine={false} axisLine={false} dy={10} />
                              <YAxis fontSize={10} fontWeight="bold" stroke="#94a3b8" tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                itemStyle={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}
                              />
                              <ReferenceLine y={4} stroke="#3b82f6" strokeDasharray="5 5" label={{ position: 'right', value: 'Meta', fontSize: 10, fill: '#3b82f6', fontWeight: 'bold' }} />
                              <Line type="monotone" dataKey="quantidade" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Form Card */}
                  <Card id="monitor-form" className="lg:col-span-1 border-none shadow-sm bg-white h-fit sticky top-6">
                    <CardHeader className="border-b border-slate-50 py-4">
                      <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <Plus className="w-4 h-4 text-blue-600" />
                        {editingRecord ? "Editar Registro" : "Novo Registro Diário"}
                      </h3>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data</Label>
                        <Input 
                          id="date" 
                          type="date" 
                          value={newRecord.date} 
                          onChange={(e) => setNewRecord(p => ({ ...p, date: e.target.value }))}
                          className="font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qtd. ativados</Label>
                        <Input 
                          id="quantity" 
                          type="number" 
                          min="0"
                          value={newRecord.quantity} 
                          onChange={(e) => setNewRecord(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))}
                          className="font-bold text-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="note" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Observação (Opcional)</Label>
                        <Textarea 
                          id="note" 
                          placeholder="Ex: Treinamento novo colaborador..."
                          value={newRecord.note}
                          onChange={(e) => setNewRecord(p => ({ ...p, note: e.target.value }))}
                          className="min-h-[80px] text-xs font-medium"
                        />
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <Button onClick={handleSaveMonitorRecord} className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-11">
                          <Save className="w-4 h-4 mr-2" />
                          Salvar registro
                        </Button>
                        {editingRecord && (
                          <Button variant="ghost" onClick={() => { setEditingRecord(null); setNewRecord({ date: new Date().toISOString().split('T')[0], quantity: 0, note: '' }); }} className="text-slate-400 font-bold text-xs uppercase underline">
                            Cancelar edição
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* List Card */}
                  <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden h-fit">
                    <CardHeader className="border-b border-slate-50 py-4">
                      <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        Registros recentes
                      </h3>
                    </CardHeader>
                    <div className="divide-y divide-slate-50">
                      {monitorRecords.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-10" />
                          <p className="text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
                        </div>
                      ) : (
                        monitorRecords.map((record) => (
                          <div key={record.id} className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black ${record.quantity >= 4 ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-slate-50 text-slate-400 ring-1 ring-slate-100'}`}>
                                <span className="text-lg leading-none">{record.quantity}</span>
                                <span className="text-[8px] uppercase tracking-tighter">unid</span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                                  {new Date(record.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                </h4>
                                {record.note && <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{record.note}</p>}
                                <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-0.5">{record.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => handleEditRecord(record)} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-white shadow-sm border border-transparent hover:border-slate-100">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteRecord(record.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-white shadow-sm border border-transparent hover:border-slate-100">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}
            
            {activeSubTab === 'produtividade' && (
              <motion.div 
                key="productivity"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pb-12"
              >
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Produtividade no cadastro</h2>
                    <p className="text-sm text-slate-500 font-medium">Melhorias para aumentar a velocidade, reduzir retrabalho e facilitar o cadastro de produtos</p>
                  </div>
                  <Button 
                    onClick={handleAddProductivity}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar melhoria
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {productivityItems
                    .sort((a, b) => (Number(a.completed || 0) - Number(b.completed || 0)) || (b.createdAt - a.createdAt))
                    .map((item) => {
                    const IconComponent = {
                      Cpu: Cpu,
                      Zap: Zap,
                      Monitor: Monitor,
                      Image: ImageIcon,
                      CheckCircle2: CheckCircle2,
                      Edit2: Edit2,
                      AlignLeft: AlignLeft,
                      Activity: Activity,
                      Rocket: Rocket,
                      Timer: Timer,
                      Lightbulb: Lightbulb
                    }[item.icon || 'Zap'] || Zap;

                    return (
                      <Card 
                        key={item.id} 
                        className={`border-2 transition-all group relative bg-white overflow-hidden ${
                          item.completed 
                            ? 'opacity-70 border-green-100 bg-slate-50/50 grayscale-[0.2]' 
                            : 'border-transparent shadow-sm hover:shadow-md'
                        }`}
                      >
                         {/* Completion Checkmark */}
                         <button 
                          onClick={() => handleToggleProductivityCompletion(item)}
                          className={`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all border-2 z-10 ${
                            item.completed 
                              ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' 
                              : 'bg-white border-slate-100 text-transparent hover:border-green-200 hover:text-green-200'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <CardContent className="p-6">
                          <div className="flex gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all ${
                              item.completed ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              <IconComponent className="w-7 h-7" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <h3 className={`font-black uppercase tracking-tight text-sm leading-tight pr-8 ${item.completed ? 'text-slate-500 line-through decoration-green-500/30' : 'text-slate-900'}`}>
                                  {item.title}
                                </h3>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" onClick={() => setEditingProductivity(item)} className="h-7 w-7 text-slate-400 hover:text-blue-600">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteProductivity(item.id)} className="h-7 w-7 text-slate-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className={`text-xs font-medium leading-relaxed ${item.completed ? 'text-slate-400' : 'text-slate-600'}`}>
                                {item.description}
                              </p>
                              {item.note && (
                                <div className={`p-2 rounded-lg border-l-4 ${item.completed ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-blue-200'}`}>
                                  <p className="text-[10px] text-slate-500 font-bold italic">{item.note}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeSubTab === 'pc' && (
              <motion.div 
                key="pc"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Configuração de PC</h2>
                    <p className="text-sm text-slate-500 font-medium">Recomendação técnica para produtividade no cadastro</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setTempPerformanceContent(performanceContent);
                      setShowPerformanceModal(true);
                      setIsEditingPerformance(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg shadow-lg shadow-blue-100"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Melhorar desempenho
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'ram', label: 'Memória RAM', value: 'Mínimo 8GB (Recomendado 16GB)', icon: HardDrive, desc: 'Essencial para manter ERP, HUB e várias abas de anúncio abertas simultaneamente.' },
                    { id: 'cpu', label: 'Processador', value: 'Intel Core i5 ou superior (Gerações recentes)', icon: Cpu, desc: 'Processamento rápido para importação de planilhas e upload de imagens.' },
                    { id: 'ssd', label: 'Armazenamento', value: 'SSD de no mínimo 240GB', icon: Wind, desc: 'Aumenta significativamente a velocidade de abertura do sistema e arquivos.' },
                    { id: 'monitor', label: 'Monitor', value: 'Recomendado: 2 Monitores (Full HD)', icon: Monitor, desc: 'Recomendamos o uso de 2 monitores para melhorar a produtividade. Ajuda a copiar e conferir informações com mais agilidade entre ERP, catálogos e marketplaces.' }
                  ].map((item, idx) => (
                    <Card key={item.id} className="border border-slate-200 shadow-sm bg-white overflow-hidden group relative">
                      {/* Checkbox persistence */}
                      <button 
                        onClick={() => togglePcCheck(item.id)}
                        className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all border-2 ${
                          pcChecks[item.id] 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'bg-white border-slate-200 text-transparent hover:border-green-300'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <CardContent className="p-6">
                        <div className="flex items-start gap-5 pr-8">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-inner ${
                            pcChecks[item.id] ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            <item.icon className="w-7 h-7" />
                          </div>
                          <div className="space-y-2">
                             <div>
                               <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm">{item.label}</h4>
                               <p className={`${pcChecks[item.id] ? 'text-green-600' : 'text-blue-600'} font-black text-xs`}>{item.value}</p>
                             </div>
                             <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {activeSubTab === 'ebooks' && (
              <motion.div 
                key="ebooks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <EbooksSubTab />
              </motion.div>
            )}

            {activeSubTab === 'vtex' && (
              <motion.div 
                key="vtex"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <VtexBestSellersTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Edit Modals */}
      <AnimatePresence>
        {/* Step Edit Modal */}
        {editingStep && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingStep(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
                <h3 className="font-black uppercase tracking-tight">{editingStep.id ? 'Editar Passo' : 'Novo Passo'}</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingStep(null)} className="text-white hover:bg-white/10"><X className="w-5 h-5" /></Button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Nome do Passo</Label>
                       <Input value={editingStep.name} onChange={e => setEditingStep({...editingStep, name: e.target.value})} placeholder="Ex: Pesquisa de concorrentes" />
                    </div>
                    <div className="space-y-2">
                       <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Posição</Label>
                       <Input type="number" value={editingStep.position} onChange={e => setEditingStep({...editingStep, position: parseInt(e.target.value) || 0})} />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">URL da Imagem</Label>
                    <Input value={editingStep.imageUrl || ''} onChange={e => setEditingStep({...editingStep, imageUrl: e.target.value})} placeholder="https://..." />
                 </div>
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Explicação</Label>
                    <Textarea value={editingStep.explanation} onChange={e => setEditingStep({...editingStep, explanation: e.target.value})} rows={6} placeholder="Descreva o processo detalhadamente..." />
                 </div>

                 {/* Improvements Edit list */}
                 <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                       <Label className="uppercase text-[10px] font-black tracking-widest text-blue-600">Melhorias e Ajustes</Label>
                       <Button size="sm" variant="ghost" onClick={() => setEditingStep({...editingStep, improvements: [...(editingStep.improvements || []), { version: `v${(editingStep.improvements || []).length + 1}`, detail: '' }]})} className="text-xs font-bold text-blue-600">
                         <Plus className="w-3 h-3 mr-1" /> Add Melhoria
                       </Button>
                    </div>
                    <div className="space-y-2">
                       {editingStep.improvements?.map((imp, i) => (
                         <div key={i} className="flex gap-2">
                            <Input value={imp.version} onChange={e => {
                               const imps = [...(editingStep.improvements || [])];
                               imps[i].version = e.target.value;
                               setEditingStep({...editingStep, improvements: imps});
                            }} className="w-20 font-bold" />
                            <Input value={imp.detail} onChange={e => {
                               const imps = [...(editingStep.improvements || [])];
                               imps[i].detail = e.target.value;
                               setEditingStep({...editingStep, improvements: imps});
                            }} placeholder="Detalhe da melhoria..." className="flex-1" />
                            <Button variant="ghost" size="icon" onClick={() => setEditingStep({...editingStep, improvements: editingStep.improvements?.filter((_, idx) => idx !== i)})} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                 <Button variant="outline" onClick={() => setEditingStep(null)}>Cancelar</Button>
                 <Button onClick={handleSaveStep} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">Salvar Alterações</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Access Edit Modal */}
        {editingAccess && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingAccess(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Configurar Acesso</h3>
                  <Button variant="ghost" size="icon" onClick={() => setEditingAccess(null)} className="rounded-full text-slate-450 hover:bg-slate-100"><X className="w-5 h-5 text-slate-450" /></Button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Nome do Sistema/Ferramenta</Label>
                        <Input value={editingAccess.toolName} onChange={e => setEditingAccess({...editingAccess, toolName: e.target.value})} placeholder="Ex: Login Sankhya" />
                     </div>
                     <div className="flex items-center gap-2">
                        <input type="checkbox" checked={editingAccess.hasAccess} onChange={e => setEditingAccess({...editingAccess, hasAccess: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                        <Label>Acesso já liberado?</Label>
                     </div>
                  </div>
               </div>
               <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                  <Button variant="outline" onClick={() => setEditingAccess(null)}>Cancelar</Button>
                  <Button onClick={handleSaveAccess} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">Salvar</Button>
               </div>
            </motion.div>
          </div>
        )}

        {/* System Edit Modal */}
        {editingSystem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingSystem(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 bg-blue-600 text-white">
                <h3 className="font-black uppercase tracking-tight">Editar {editingSystem.id.toUpperCase()}</h3>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Título</Label>
                    <Input value={editingSystem.title} onChange={e => setEditingSystem({...editingSystem, title: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Explicação Geral</Label>
                    <Textarea value={editingSystem.explanation} onChange={e => setEditingSystem({...editingSystem, explanation: e.target.value})} rows={3} />
                 </div>
                 <div className="space-y-2 pt-4">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-blue-600">Conteúdo Detalhado (Texto e Links)</Label>
                    <Textarea value={editingSystem.content} onChange={e => setEditingSystem({...editingSystem, content: e.target.value})} rows={12} placeholder="Insira aqui o guia de uso, links de acesso e URLs de imagens para pré-visualização..." className="font-mono text-sm" />
                 </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                 <Button variant="outline" onClick={() => setEditingSystem(null)}>Cancelar</Button>
                 <Button onClick={handleSaveSystem} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">Salvar Conteúdo</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Productivity Edit Modal */}
        {editingProductivity && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingProductivity(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
                <h3 className="font-black uppercase tracking-tight text-sm">{editingProductivity.id ? 'Editar Melhoria' : 'Nova Melhoria'}</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingProductivity(null)} className="text-white hover:bg-white/10"><XIcon className="w-5 h-5" /></Button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Título da melhoria</Label>
                    <Input value={editingProductivity.title} onChange={e => setEditingProductivity({...editingProductivity, title: e.target.value})} placeholder="Ex: Segundo monitor..." />
                 </div>
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Descrição</Label>
                    <Textarea value={editingProductivity.description} onChange={e => setEditingProductivity({...editingProductivity, description: e.target.value})} rows={4} placeholder="Descreva como isso ajuda no cadastro..." />
                 </div>
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Observação (Opcional)</Label>
                    <Input value={editingProductivity.note} onChange={e => setEditingProductivity({...editingProductivity, note: e.target.value})} placeholder="Dica extra ou cuidado importante..." />
                 </div>
                 <div className="space-y-2">
                    <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Ícone</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { id: 'Rocket', icon: Rocket },
                        { id: 'Zap', icon: Zap },
                        { id: 'Timer', icon: Timer },
                        { id: 'Cpu', icon: Cpu },
                        { id: 'Monitor', icon: Monitor },
                        { id: 'Image', icon: ImageIcon },
                        { id: 'CheckCircle2', icon: CheckCircle2 },
                        { id: 'Edit2', icon: Edit2 },
                        { id: 'AlignLeft', icon: AlignLeft },
                        { id: 'Activity', icon: Activity },
                        { id: 'Lightbulb', icon: Lightbulb }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setEditingProductivity({...editingProductivity, icon: item.id})}
                          className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center ${editingProductivity.icon === item.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400 hover:border-blue-200'}`}
                        >
                          <item.icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                 <Button variant="outline" onClick={() => setEditingProductivity(null)}>Cancelar</Button>
                 <Button onClick={handleSaveProductivity} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">Salvar Melhoria</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Performance Optimization Modal */}
        {showPerformanceModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPerformanceModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 bg-blue-600 text-white flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <h3 className="font-black uppercase tracking-tight text-lg">Melhorar desempenho do PC</h3>
                  <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">Configurações recomendadas para deixar o computador mais leve e produtivo no cadastro de produtos</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowPerformanceModal(false)} className="text-white hover:bg-white/10">
                  <XIcon className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
                 {isEditingPerformance ? (
                   <div className="space-y-4 h-full flex flex-col">
                      <Label className="uppercase text-[10px] font-black tracking-widest text-blue-600">Editar Orientações (Suporta Markdown)</Label>
                      <Textarea 
                        value={tempPerformanceContent} 
                        onChange={e => setTempPerformanceContent(e.target.value)} 
                        className="flex-1 min-h-[400px] font-mono text-sm shadow-inner bg-white whitespace-pre-wrap"
                        placeholder="Use # para títulos, ** para negrito, * para itálico..."
                      />
                   </div>
                 ) : (
                   <div className="prose prose-slate max-w-none prose-sm md:prose-base prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:text-slate-900 prose-strong:text-blue-700 prose-li:text-slate-600 whitespace-pre-wrap">
                      <ReactMarkdown>{performanceContent}</ReactMarkdown>
                   </div>
                 )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                 <Button variant="ghost" onClick={() => setShowPerformanceModal(false)} className="font-bold text-slate-500">Fechar</Button>
                 {isEditingPerformance ? (
                   <>
                      <Button variant="outline" onClick={() => setIsEditingPerformance(false)} className="font-bold">Cancelar</Button>
                      <Button onClick={handleSavePerformance} className="bg-green-600 hover:bg-green-700 text-white font-bold px-8">Salvar Alterações</Button>
                   </>
                 ) : (
                   <Button onClick={() => setIsEditingPerformance(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                     <Edit2 className="w-4 h-4 mr-2" />
                     Editar Orientações
                   </Button>
                 )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Product Rule Edit Modal */}
        {editingRule && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingRule(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
                <h3 className="font-black uppercase tracking-tight text-sm">
                  {editingRule.id === 'general-rules' 
                    ? 'Editar Regras Gerais' 
                    : (productRules.some(r => r.id === editingRule.id) ? 'Editar Card de Produto' : 'Novo Card de Produto')
                  }
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setEditingRule(null)} className="text-white hover:bg-white/10"><XIcon className="w-5 h-5" /></Button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {editingRule.id === 'general-rules' ? (
                  <>
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Informações obrigatórias para todos os produtos</Label>
                      <Textarea 
                        value={editingRule.requiredInfo} 
                        onChange={e => setEditingRule({...editingRule, requiredInfo: e.target.value})} 
                        rows={6} 
                        placeholder="Insira as regras obrigatórias que valem para todos os produtos gerais..." 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Informações que não podem aparecer em nenhum produto</Label>
                      <Textarea 
                        value={editingRule.forbiddenInfo} 
                        onChange={e => setEditingRule({...editingRule, forbiddenInfo: e.target.value})} 
                        rows={6} 
                        placeholder="Insira as informações de cadastro proibidas para todos os produtos gerais..." 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {!productRules.some(r => r.id === editingRule.id) && (
                      <div className="flex gap-4 items-end">
                        <div className="space-y-2">
                          <div 
                            onClick={handleOpenImageModal}
                            className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden shadow-inner group relative"
                          >
                            {editingRule.imageUrl ? (
                              <>
                                <img src={editingRule.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-100 flex items-center justify-center transition-all">
                                  <Edit2 className="w-4 h-4 text-white" />
                                </div>
                              </>
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <Label className="text-xs font-bold text-slate-500 block mb-1">Tipo de produto</Label>
                          <Input 
                            value={editingRule.name} 
                            onChange={e => setEditingRule({...editingRule, name: e.target.value})} 
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-500 block">O que produto deve ter?</Label>
                      
                      {/* Current list of items */}
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {(() => {
                          const items = editingRule.requiredInfo ? editingRule.requiredInfo.split('\n').filter(Boolean) : [];
                          if (items.length === 0) {
                            return (
                              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                                Nenhuma informação adicionada ainda. Escreva no campo abaixo e adicione itens.
                              </p>
                            );
                          }
                          return items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 p-2 bg-emerald-50/10 hover:bg-emerald-50/20 rounded-lg border border-emerald-100/25 transition-all">
                              <div className="flex items-start gap-2 min-w-0">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-xs text-slate-700 font-medium break-words leading-relaxed">{item}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteInfoItem(idx)}
                                className="h-7 w-7 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Add new item control */}
                      <div className="flex gap-2 items-center">
                        <Input
                          value={newInfoText}
                          onChange={e => setNewInfoText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddInfoItem();
                            }
                          }}
                          className="flex-1 text-xs h-9"
                        />
                        <Button
                          type="button"
                          onClick={handleAddInfoItem}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 text-xs rounded-lg shadow-sm"
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <Button variant="outline" onClick={() => setEditingRule(null)}>Cancelar</Button>
                <Button onClick={handleSaveRule} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">Salvar Alterações</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Image Input Link Modal (Second Modal) */}
        {showImageModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">Inserir link da imagem</h4>
                <Button variant="ghost" size="icon" onClick={() => setShowImageModal(false)} className="rounded-full h-8 w-8 text-slate-400 hover:bg-slate-100"><XIcon className="w-4 h-4" /></Button>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label className="uppercase text-[10px] font-black tracking-widest text-slate-500">Cole a URL da Imagem</Label>
                  <Input 
                    value={imageUrlInput} 
                    onChange={e => setImageUrlInput(e.target.value)} 
                    placeholder="https://exemplo.com/imagem.jpg" 
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Coloque um link direto para a imagem. Ela será processada e exibida no card do produto.
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setShowImageModal(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleSaveImageLink} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5">Salvar imagem</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom Confirmation Modal for deletion */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">Excluir card de produto</h3>
                <p className="text-sm text-slate-500">Tem certeza que deseja excluir este card de produto?</p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)} className="px-5">Cancelar</Button>
                <Button size="sm" onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold px-5">Excluir</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Internal icons helper for reordering drag
function X({ className }: { className?: string }) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>; }
