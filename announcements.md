---
layout: page
title: 课程通知
description: A feed containing all of the class announcements.
---

# 课程通知

{% assign announcements = site.announcements | reverse %}
{% for announcement in announcements %}
{{ announcement }}
{% endfor %}
