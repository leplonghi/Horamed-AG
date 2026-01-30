#!/usr/bin/env python3
"""
Script para detectar links quebrados e rotas não existentes no HoraMed
"""

import os
import re
from pathlib import Path
from collections import defaultdict

def extract_routes_from_app_tsx(app_path):
    """Extrai todas as rotas definidas em App.tsx"""
    routes = set()
    
    with open(app_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Padrões para encontrar rotas
    # <Route path="/rota" ...
    route_pattern = r'<Route\s+path="([^"]+)"'
    # <Navigate to="/rota" ...
    navigate_pattern = r'<Navigate\s+to="([^"]+)"'
    
    for match in re.finditer(route_pattern, content):
        route = match.group(1)
        # Remove parâmetros dinâmicos
        route = re.sub(r':[^/]+', ':param', route)
        routes.add(route)
    
    for match in re.finditer(navigate_pattern, content):
        route = match.group(1)
        routes.add(route)
    
    return routes

def find_navigation_links(src_path):
    """Encontra todos os links de navegação no código"""
    links = defaultdict(list)
    
    # Padrões para encontrar navegação
    patterns = [
        (r'to="(/[^"]*)"', 'Link to'),
        (r'navigate\([\'"](/[^\'"]*)[\'"]', 'navigate()'),
        (r'href="(/[^"]*)"', 'href'),
    ]
    
    for root, dirs, files in os.walk(src_path):
        # Ignorar node_modules e outros diretórios
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build']]
        
        for file in files:
            if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, src_path)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        line_num = 0
                        for line in content.split('\n'):
                            line_num += 1
                            for pattern, link_type in patterns:
                                for match in re.finditer(pattern, line):
                                    route = match.group(1)
                                    # Ignorar rotas externas e âncoras
                                    if route.startswith('http') or route.startswith('#'):
                                        continue
                                    # Remover query strings e hashes
                                    route = route.split('?')[0].split('#')[0]
                                    # Remover parâmetros dinâmicos
                                    route = re.sub(r'/[^/]+/[a-f0-9-]{36}', '/:param', route)
                                    route = re.sub(r'/\d+', '/:param', route)
                                    
                                    links[route].append({
                                        'file': rel_path,
                                        'line': line_num,
                                        'type': link_type,
                                        'original': match.group(0)
                                    })
                except Exception as e:
                    print(f"⚠️  Erro ao ler {rel_path}: {e}")
    
    return links

def normalize_route(route):
    """Normaliza uma rota para comparação"""
    # Remove trailing slash
    if route != '/' and route.endswith('/'):
        route = route[:-1]
    # Substitui parâmetros dinâmicos
    route = re.sub(r':[^/]+', ':param', route)
    return route

def check_broken_links(project_root):
    """Verifica links quebrados no projeto"""
    src_path = os.path.join(project_root, 'src')
    app_tsx = os.path.join(src_path, 'App.tsx')
    
    print("🔍 Analisando rotas e links do HoraMed...\n")
    
    # 1. Extrair rotas definidas
    print("📋 Extraindo rotas definidas em App.tsx...")
    defined_routes = extract_routes_from_app_tsx(app_tsx)
    normalized_routes = {normalize_route(r) for r in defined_routes}
    
    print(f"✅ Encontradas {len(defined_routes)} rotas definidas\n")
    
    # 2. Encontrar todos os links de navegação
    print("🔗 Procurando links de navegação no código...")
    navigation_links = find_navigation_links(src_path)
    
    print(f"✅ Encontrados {len(navigation_links)} links únicos\n")
    
    # 3. Verificar links quebrados
    print("=" * 80)
    print("🚨 LINKS QUEBRADOS ENCONTRADOS:")
    print("=" * 80)
    
    broken_links = []
    
    for link, occurrences in sorted(navigation_links.items()):
        normalized_link = normalize_route(link)
        
        # Verificar se a rota existe
        is_broken = normalized_link not in normalized_routes
        
        # Exceções: rotas que são válidas mas não estão em App.tsx
        exceptions = ['/', '/auth', '/landing-preview']
        if link in exceptions:
            is_broken = False
        
        if is_broken:
            broken_links.append((link, occurrences))
            print(f"\n❌ Rota não encontrada: {link}")
            print(f"   Normalizada: {normalized_link}")
            print(f"   Ocorrências ({len(occurrences)}):")
            for occ in occurrences[:5]:  # Mostrar apenas as primeiras 5
                print(f"   • {occ['file']}:{occ['line']} - {occ['type']}")
                print(f"     {occ['original']}")
            if len(occurrences) > 5:
                print(f"   ... e mais {len(occurrences) - 5} ocorrências")
    
    # 4. Resumo
    print("\n" + "=" * 80)
    print("📊 RESUMO:")
    print("=" * 80)
    print(f"✅ Rotas definidas: {len(defined_routes)}")
    print(f"🔗 Links únicos encontrados: {len(navigation_links)}")
    print(f"❌ Links quebrados: {len(broken_links)}")
    
    if broken_links:
        print("\n🔧 AÇÕES RECOMENDADAS:")
        print("=" * 80)
        for link, occurrences in broken_links:
            print(f"\n• Corrigir rota: {link}")
            # Sugerir rota similar
            similar = find_similar_route(link, defined_routes)
            if similar:
                print(f"  Sugestão: {similar}")
    else:
        print("\n✅ Nenhum link quebrado encontrado!")
    
    return broken_links

def find_similar_route(link, routes):
    """Encontra rota similar usando distância de edição simples"""
    link_parts = link.strip('/').split('/')
    best_match = None
    best_score = 0
    
    for route in routes:
        route_parts = route.strip('/').split('/')
        
        # Calcular similaridade
        common = set(link_parts) & set(route_parts)
        if len(common) > best_score:
            best_score = len(common)
            best_match = route
    
    return best_match if best_score > 0 else None

if __name__ == "__main__":
    # Detectar raiz do projeto
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    
    broken = check_broken_links(project_root)
    
    # Exit code
    exit(1 if broken else 0)
