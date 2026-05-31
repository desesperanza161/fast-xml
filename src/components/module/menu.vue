<template>
    <div class="tools"></div>
        <div class="group">
            <slot name="edit-buttons"/>
        </div>
        <div class="export>">
            <slot name="export_import"/>
        </div>
        <div class="project">
            <slot name="project-button" />
        </div>
    </template>

    <script setup land="ts"></script>

    <style scoped>
.toolbar{
    display: flex;
    gap: 20px;
    flew-wrap: wrap
}
.group, .export, .project{
    display: flex;
    gap: 16px;
}
</style>