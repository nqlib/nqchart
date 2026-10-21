---
name: nqchart-fixed-domain-funnel-order
description: >-
  Funnel stage ordering — ECharts series-funnel.sort reordering pipeline
  stages when values cross. Open when stages jump position after data updates.
skill: nqchart-fixed
kind: domain
domain: funnel-order
tags: funnel, sort, stage-order, pipeline, descending
metadata:
  author: nqchart
  version: "1.0.0"
---

# Domain: funnel stage order

Native ECharts funnel can reorder stages by value via `series-funnel.sort`. Pipeline charts need stable `data` order.

## Fix notes

| Fix | Symptoms |
|-----|----------|
| [funnel-order-sort-none](../fixes/funnel-order-sort-none.md) | Stages jump when a mid-stage outgrows an earlier one; hardcoded `sort: "descending"` |
