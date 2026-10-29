#!/usr/bin/env bash
# Chaos Day incidents. Run one at a time: bash chaos.sh 1   (then 2, then 3)
# Each incident breaks something. Your job: notice, diagnose, fix, and write it up in RUNBOOK.md.
set -u
D=crowd-meter
case "${1:-}" in
  1)
    echo "🔥 INCIDENT 1 · 02:13 · A node hiccup killed a Pod."
    P=$(kubectl get pod -l app=$D -o jsonpath='{.items[0].metadata.name}')
    kubectl delete pod "$P" --wait=false
    echo "   Deleted $P. Did users notice? What did Kubernetes do, and how fast? Prove it (kubectl get pod -w, kubectl get events)."
    ;;
  2)
    echo "🔥 INCIDENT 2 · 09:41 · A teammate shipped a release that doesn't exist."
    kubectl set image deploy/$D $D=$D:v9-hotfix-typo
    echo "   What status do the new Pods show? Are users still served? Get back to a healthy state and explain WHY it was (or wasn't) an outage."
    ;;
  3)
    echo "🔥 INCIDENT 3 · 12:05 · Lunch rush. Traffic x5 for the next 10 minutes."
    echo "   Scale so that 5 copies serve traffic. Prove the Service spreads requests over all 5 (hint: curl loop on the /health 'host' field)."
    echo "   Then marketing wants the greeting changed to 'Lunch rush: please queue on the left' with NO image rebuild. Do it."
    ;;
  *)
    echo "usage: bash chaos.sh <1|2|3>"; exit 1 ;;
esac
