# Diagrama de infraestructura AWS

Diagrama como código (Python) para la infraestructura del proyecto: **App Runner**, **ECR** y **S3** (backend de estado de Terraform).

## Requisitos

- Python 3.9+
- [Graphviz](https://graphviz.org/) instalado en el sistema (el comando `dot` debe estar en el PATH):
  - **macOS:** `brew install graphviz` y, si hace falta, `echo 'export PATH="/opt/homebrew/opt/graphviz/bin:$PATH"' >> ~/.zshrc` y reinicia la terminal.
  - **Ubuntu/Debian:** `sudo apt install graphviz`
  - **Windows:** instalar desde [graphviz.org](https://graphviz.org/download/) y añadir la carpeta `bin` al PATH.

Comprueba que está instalado: `dot -V`

## Uso

```bash
cd diagram-aws
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python infra_diagram.py
```

Se genera `diagram.png` en el mismo directorio.

## Contenido del diagrama

- **Client** → **App Runner**: tráfico hacia la API.
- **GitHub Actions** → **ECR**: build y push de la imagen Docker.
- **ECR** → **App Runner**: App Runner ejecuta la imagen del registro.
- **S3**: backend opcional del estado de Terraform (dev/prod).
