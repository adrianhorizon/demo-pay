"""
Infrastructure diagram for Payments API (AWS App Runner + ECR + S3).
Generates diagram.png using the diagrams library.
Requires: pip install diagrams, and system Graphviz (e.g. brew install graphviz).
"""

from diagrams import Cluster, Diagram
from diagrams.aws.compute import AppRunner, ECR
from diagrams.aws.storage import S3
from diagrams.onprem.ci import GithubActions
from diagrams.onprem.client import Client

with Diagram(
    "Payments API – AWS Infrastructure",
    direction="TB",
    filename="diagram",
    show=False,
    outformat="png",
):
    client = Client("Client")

    with Cluster("CI/CD"):
        gh = GithubActions("GitHub Actions")

    with Cluster("Terraform state"):
        s3 = S3("S3\n(state backend)")

    ecr = ECR("ECR\n(API image)")
    app = AppRunner("App Runner\n(Payments API)")

    gh >> ecr
    ecr >> app
    client >> app
