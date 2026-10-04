import os
import pandas as pd

def main():
    results_csv = os.path.join("test_images", "retrieval_results.csv")
    summary_csv = os.path.join("test_images", "retrieval_summary.csv")
    gallery_html = os.path.join("test_images", "retrieval_gallery.html")

    if not os.path.exists(results_csv):
        raise FileNotFoundError(f"Results CSV not found at '{results_csv}'")

    df = pd.read_csv(results_csv)

    # 1. Create retrieval_summary.csv
    summary_df = df[["test_image", "rank", "similarity", "matched_image_name", "matched_image_path"]]
    summary_df.to_csv(summary_csv, index=False)
    print(f"Created '{summary_csv}'")

    # 2. Build HTML Content for retrieval_gallery.html
    sections = [
        ("perumal.jpg", "PERUMAL", "External Query Artifact: Perumal (Vishnu Statue)"),
        ("lakshmi.jpg", "LAKSHMI", "External Query Artifact: Lakshmi (Goddess Statue)"),
        ("murugar.jpg", "MURUGAR", "External Query Artifact: Murugar (Lord Murugan Statue)")
    ]

    html_parts = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="UTF-8">',
        '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '    <title>Digital Heritage AI — Visual Retrieval Gallery</title>',
        '    <style>',
        '        :root {',
        '            --bg-color: #0f172a;',
        '            --card-bg: #1e293b;',
        '            --text-main: #f8fafc;',
        '            --text-muted: #94a3b8;',
        '            --accent-blue: #38bdf8;',
        '            --accent-gold: #f59e0b;',
        '            --border-color: #334155;',
        '            --card-hover: #26354a;',
        '        }',
        '        body {',
        '            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
        '            background-color: var(--bg-color);',
        '            color: var(--text-main);',
        '            margin: 0;',
        '            padding: 24px;',
        '        }',
        '        .header {',
        '            text-align: center;',
        '            padding-bottom: 24px;',
        '            border-bottom: 1px solid var(--border-color);',
        '            margin-bottom: 32px;',
        '        }',
        '        .header h1 {',
        '            font-size: 2.2rem;',
        '            margin: 0 0 8px 0;',
        '            background: linear-gradient(135deg, #38bdf8, #818cf8);',
        '            -webkit-background-clip: text;',
        '            -webkit-text-fill-color: transparent;',
        '        }',
        '        .header p {',
        '            color: var(--text-muted);',
        '            margin: 0;',
        '            font-size: 1rem;',
        '        }',
        '        .section-title {',
        '            font-size: 1.6rem;',
        '            margin: 40px 0 20px 0;',
        '            padding-bottom: 8px;',
        '            border-bottom: 2px solid var(--accent-gold);',
        '            color: var(--accent-gold);',
        '        }',
        '        .gallery-container {',
        '            display: flex;',
        '            flex-direction: column;',
        '            gap: 24px;',
        '        }',
        '        .query-panel {',
        '            display: flex;',
        '            gap: 24px;',
        '            background-color: rgba(245, 158, 11, 0.05);',
        '            border: 2px solid var(--accent-gold);',
        '            border-radius: 12px;',
        '            padding: 20px;',
        '            align-items: center;',
        '        }',
        '        .query-card {',
        '            width: 220px;',
        '            flex-shrink: 0;',
        '            text-align: center;',
        '        }',
        '        .badge-query {',
        '            background-color: var(--accent-gold);',
        '            color: #020617;',
        '            font-weight: bold;',
        '            font-size: 0.85rem;',
        '            padding: 4px 12px;',
        '            border-radius: 20px;',
        '            display: inline-block;',
        '            margin-bottom: 12px;',
        '        }',
        '        .query-info {',
        '            flex-grow: 1;',
        '        }',
        '        .query-info h3 {',
        '            margin: 0 0 8px 0;',
        '            color: var(--accent-gold);',
        '            font-size: 1.4rem;',
        '        }',
        '        .query-info p {',
        '            color: var(--text-muted);',
        '            margin: 4px 0;',
        '            font-size: 0.95rem;',
        '        }',
        '        .results-grid {',
        '            display: grid;',
        '            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));',
        '            gap: 16px;',
        '        }',
        '        .result-card {',
        '            background-color: var(--card-bg);',
        '            border: 1px solid var(--border-color);',
        '            border-radius: 10px;',
        '            padding: 12px;',
        '            display: flex;',
        '            flex-direction: column;',
        '            transition: transform 0.2s ease, background-color 0.2s ease;',
        '        }',
        '        .result-card:hover {',
        '            transform: translateY(-4px);',
        '            background-color: var(--card-hover);',
        '            border-color: var(--accent-blue);',
        '        }',
        '        .card-header {',
        '            display: flex;',
        '            justify-content: space-between;',
        '            align-items: center;',
        '            margin-bottom: 8px;',
        '        }',
        '        .rank-badge {',
        '            background-color: #334155;',
        '            color: var(--accent-blue);',
        '            font-weight: bold;',
        '            font-size: 0.8rem;',
        '            padding: 2px 8px;',
        '            border-radius: 6px;',
        '        }',
        '        .similarity-badge {',
        '            background-color: rgba(56, 189, 248, 0.15);',
        '            color: var(--accent-blue);',
        '            font-weight: 600;',
        '            font-size: 0.85rem;',
        '            padding: 2px 8px;',
        '            border-radius: 6px;',
        '            border: 1px solid rgba(56, 189, 248, 0.3);',
        '        }',
        '        .img-wrapper {',
        '            width: 100%;',
        '            height: 180px;',
        '            background-color: #020617;',
        '            border-radius: 6px;',
        '            overflow: hidden;',
        '            display: flex;',
        '            align-items: center;',
        '            justify-content: center;',
        '            margin-bottom: 10px;',
        '        }',
        '        .img-wrapper img {',
        '            max-width: 100%;',
        '            max-height: 100%;',
        '            object-fit: contain;',
        '        }',
        '        .filename-text {',
        '            font-size: 0.8rem;',
        '            color: var(--text-muted);',
        '            word-break: break-all;',
        '            line-height: 1.3;',
        '            margin-top: auto;',
        '        }',
        '    </style>',
        '</head>',
        '<body>',
        '    <div class="header">',
        '        <h1>Digital Heritage AI — Visual Retrieval Gallery</h1>',
        '        <p>Offline Visual Quality Inspection for External Artifact Query Images</p>',
        '    </div>',
        '    <div class="gallery-container">'
    ]

    for query_file, title, desc in sections:
        sub_df = df[df["test_image"] == query_file].sort_values("rank")
        if sub_df.empty:
            continue

        top1_sim = sub_df.iloc[0]["similarity"]

        html_parts.append(f'        <!-- SECTION {title} -->')
        html_parts.append(f'        <h2 class="section-title">{title}</h2>')
        html_parts.append('        <div class="query-panel">')
        html_parts.append('            <div class="query-card">')
        html_parts.append('                <span class="badge-query">QUERY ARTIFACT</span>')
        html_parts.append('                <div class="img-wrapper" style="height: 200px; margin-bottom: 0;">')
        html_parts.append(f'                    <img src="{query_file}" alt="{query_file}">')
        html_parts.append('                </div>')
        html_parts.append('            </div>')
        html_parts.append('            <div class="query-info">')
        html_parts.append(f'                <h3>{desc}</h3>')
        html_parts.append(f'                <p><strong>Query Image:</strong> {query_file}</p>')
        html_parts.append('                <p><strong>Retrieved Matches:</strong> Top 10 nearest heritage artifacts from 20,399 dataset</p>')
        html_parts.append(f'                <p><strong>Top 1 Similarity Score:</strong> {top1_sim:.6f}</p>')
        html_parts.append('            </div>')
        html_parts.append('        </div>')
        html_parts.append('        <div class="results-grid">')

        for _, row in sub_df.iterrows():
            rank = row["rank"]
            sim = row["similarity"]
            name = row["matched_image_name"]
            img_src = f"../images/{name}"

            html_parts.append('            <div class="result-card">')
            html_parts.append('                <div class="card-header">')
            html_parts.append(f'                    <span class="rank-badge">Rank {rank}</span>')
            html_parts.append(f'                    <span class="similarity-badge">{sim:.6f}</span>')
            html_parts.append('                </div>')
            html_parts.append('                <div class="img-wrapper">')
            html_parts.append(f'                    <img src="{img_src}" alt="{name}" loading="lazy">')
            html_parts.append('                </div>')
            html_parts.append(f'                <div class="filename-text">{name}</div>')
            html_parts.append('            </div>')

        html_parts.append('        </div>')

    html_parts.append('    </div>')
    html_parts.append('</body>')
    html_parts.append('</html>')

    with open(gallery_html, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))

    print(f"Created '{gallery_html}' successfully!")

if __name__ == "__main__":
    main()
