#!/usr/bin/env bash
set -euo pipefail
CLUSTER_NAME="${1:-payments}"
if ! command -v kind &>/dev/null; then
  echo "kind not found. Install: https://kind.sigs.k8s.io/docs/user/quick-start/#installation"
  exit 1
fi
if kind get kubeconfig --name "$CLUSTER_NAME" &>/dev/null; then
  echo "Cluster $CLUSTER_NAME already exists"
  exit 0
fi
kind create cluster --name "$CLUSTER_NAME" --wait 90s
export KUBECONFIG="$(kind get kubeconfig --name "$CLUSTER_NAME")"
echo "Kind cluster $CLUSTER_NAME ready. KUBECONFIG=$KUBECONFIG"
