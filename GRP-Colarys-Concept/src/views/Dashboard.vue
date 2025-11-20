<template>
  <PageModel>
    <div class="dashboard">
      <!-- Section Bienvenue avec indicateurs temps réel -->
      <div class="welcome-section">
        <div class="welcome-content">
          <h1>Tableau de Bord Colarys Concept</h1>
          <p class="subtitle">Vue d'ensemble des présences, activités et plannings</p>
          <div class="current-time">
            <div class="time-display">
              <span class="time">{{ currentTime }}</span><br>
              <span class="date">{{ currentDate }}</span>
            </div>
            <div class="indicators">
              <span class="indicator online" :class="{ active: isOnline }">
                {{ isOnline ? '🟢 En ligne' : '🔴 Hors ligne' }}
              </span>
              <span class="indicator">
                📊 {{ totalAgentsToday }} agents aujourd'hui
              </span>
              <span class="indicator">
                📋 {{ planningStats.totalAgents }} agents programmés
              </span>
            </div>
          </div>
        </div>
        <div class="welcome-graphic">
          <div class="graphic-circle">
            <div class="inner-stats">
              <span class="stat-main">{{ presenceStats.presentsAujourdhui }}</span>
              <span class="stat-label">Présents</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ SECTION 1: PRÉSENCES DU JOUR ============ -->
      <section class="section-presence">
        <div class="section-header">
          <div class="section-title">
            <div class="title-icon presence">👥</div>
            <h2>Présences du Jour</h2>
          </div>
          <div class="last-update">
            Dernière mise à jour: {{ lastUpdate }}
          </div>
        </div>

        <!-- Cartes de métriques principales des présences -->
        <div class="presence-metrics-grid">
          <div class="metric-card total-present">
            <div class="metric-icon">
              <i class="fas fa-user-check"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ presenceStats.presentsAujourdhui }}</div>
              <div class="metric-label">Présents Aujourd'hui</div>
              <div class="metric-trend">
                <i class="fas fa-chart-line"></i>
                {{ presenceStats.tauxPresence }}% taux
              </div>
            </div>
          </div>

          <div class="metric-card waiting-exit">
            <div class="metric-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ presenceStats.enAttenteSortie }}</div>
              <div class="metric-label">En Attente de Sortie</div>
              <div class="metric-subtext">
                {{ Math.round((presenceStats.enAttenteSortie / presenceStats.presentsAujourdhui) * 100) || 0 }}% des
                présents
              </div>
            </div>
          </div>

          <div class="metric-card hours-worked">
            <div class="metric-icon">
              <i class="fas fa-business-time"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ presenceStats.heuresTravaillees }}</div>
              <div class="metric-label">Heures Travaillées</div>
              <div class="metric-trend">
                <i class="fas fa-clock"></i>
                Moyenne: {{ presenceStats.moyenneHeures }}h/agent
              </div>
            </div>
          </div>

          <div class="metric-card checkins-today">
            <div class="metric-icon">
              <i class="fas fa-sign-in-alt"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ presenceStats.entreesAujourdhui }}</div>
              <div class="metric-label">Entrées Aujourd'hui</div>
              <div class="metric-subtext">
                {{ presenceStats.sortiesAujourdhui }} sorties
              </div>
            </div>
          </div>
        </div>

        <!-- Répartition par campagne -->
        <div class="campaign-breakdown">
          <h4>Répartition par Campagne</h4>
          <div class="campaign-list">
            <div v-for="(count, campagne) in presenceStats.parCampagne" :key="campagne" class="campaign-item">
              <span class="campaign-name">{{ campagne }}</span>
              <div class="campaign-bar">
                <div class="campaign-fill" :style="{ width: getCampaignPercentage(count) + '%' }"></div>
              </div>
              <span class="campaign-count">{{ count }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ SECTION 2: ACTIVITÉ EN TEMPS RÉEL ============ -->
      <section class="section-realtime">
        <div class="section-header">
          <div class="section-title">
            <div class="title-icon realtime">⚡</div>
            <h2>Activité en Temps Réel</h2>
          </div>
          <div class="auto-refresh" @click="toggleAutoRefresh">
            <i class="fas fa-sync-alt" :class="{ refreshing: autoRefresh }"></i>
            Auto-refresh: {{ autoRefresh ? 'ON' : 'OFF' }}
          </div>
        </div>

        <div class="realtime-grid">
          <!-- Badgeuses récentes -->
          <div class="realtime-card checkins">
            <div class="card-header">
              <h3>🟢 Badgeuses Récentes</h3>
              <span class="badge">{{ recentCheckins.length }}</span>
            </div>
            <div class="checkins-list scrollable-list">
              <div v-if="recentCheckins.length === 0" class="no-activity">
                Aucune badgeuse récente
              </div>
              <div v-else class="checkin-items">
                <div v-for="checkin in displayedCheckins" :key="checkin.id" class="checkin-item">
                  <div class="agent-avatar">
                    <div class="avatar-placeholder">
                      {{ getInitials(checkin.agentName) }}
                    </div>
                  </div>
                  <div class="checkin-info">
                    <div class="agent-name">{{ checkin.agentName }}</div>
                    <div class="checkin-time">{{ checkin.time }}</div>
                    <div class="checkin-campaign">{{ checkin.campaign }}</div>
                  </div>
                  <div class="checkin-type" :class="checkin.type">
                    {{ checkin.type === 'in' ? '🟢 Arrivée' : '🔴 Départ' }}
                  </div>
                </div>
              </div>
            </div>
            <div v-if="recentCheckins.length > maxDisplayedCheckins" class="checkins-list-footer">
              <button class="view-more-btn" @click="showAllCheckins = !showAllCheckins">
                {{ showAllCheckins ? 'Voir moins' : `Voir tout (${recentCheckins.length})` }}
              </button>
            </div>
          </div>

          <!-- Alertes et notifications -->
          <div class="realtime-card alerts">
            <div class="card-header">
              <h3>⚠️ Alertes & Notifications</h3>
              <span class="badge alert">{{ alerts.length }}</span>
            </div>
            <div class="alerts-list scrollable-list">
              <div v-if="alerts.length === 0" class="no-alerts">
                <div class="no-alerts-icon">✅</div>
                <p>Aucune alerte critique</p>
                <small>Tout fonctionne normalement</small>
              </div>
              <div v-else class="alert-items">
                <div v-for="alert in alerts" :key="alert.id" class="alert-item" :class="alert.level">
                  <div class="alert-icon">
                    <i :class="getAlertIcon(alert.level)"></i>
                  </div>
                  <div class="alert-content">
                    <div class="alert-title">{{ alert.title }}</div>
                    <div class="alert-message">{{ alert.message }}</div>
                  </div>
                  <div class="alert-time">{{ alert.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions rapides pour la présence -->
        <div class="agents-quick-actions">
          <button @click="ouvrirGestionPresence" class="quick-action-btn primary-btn">
            <i class="fas fa-fingerprint"></i>
            Accéder au pointage
          </button>
          <button @click="genererRapportPresence" class="quick-action-btn secondary-btn">
            <i class="fas fa-chart-bar"></i>
            Rapports Présence
          </button>
          <button @click="ouvrirHistoriquePresence" class="quick-action-btn export-excel-btn">
            <i class="fas fa-history"></i>
            Voir l'historique
          </button>
        </div>
      </section>

      <!-- ============ SECTION 3: STATISTIQUES AGENTS COLARYS ============ -->
      <section class="section-agents">
        <div class="section-header">
          <div class="section-title">
            <div class="title-icon agents">👨‍💼</div>
            <h2>Statistiques des Agents Colarys</h2>
          </div>
          <div class="last-update">
            Dernière mise à jour: {{ lastUpdate }}
          </div>
        </div>

        <!-- Cartes de métriques principales des agents -->
        <div class="agents-metrics-grid">
          <div class="metric-card total-agents">
            <div class="metric-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ agentsStats.totalAgents }}</div>
              <div class="metric-label">Total Agents</div>
              <div class="metric-trend">
                <i class="fas fa-chart-line"></i>
                +{{ agentsStats.nouveauxAgents }} ce mois
              </div>
            </div>
          </div>

          <div class="metric-card roles-actifs">
            <div class="metric-icon">
              <i class="fas fa-user-tag"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ agentsStats.rolesActifs }}</div>
              <div class="metric-label">Rôles Actifs</div>
              <div class="metric-subtext">
                Répartis en {{ agentsStats.rolesActifs }} fonctions
              </div>
            </div>
          </div>

          <div class="metric-card completion">
            <div class="metric-icon">
              <i class="fas fa-chart-pie"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ agentsStats.tauxCompletion }}%</div>
              <div class="metric-label">Taux Completion</div>
              <div class="metric-trend">
                <i class="fas fa-check-circle"></i>
                Profils complétés
              </div>
            </div>
          </div>

          <div class="metric-card nouveaux">
            <div class="metric-icon">
              <i class="fas fa-user-plus"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ agentsStats.nouveauxAgents }}</div>
              <div class="metric-label">Nouveaux Agents</div>
              <div class="metric-subtext">
                Ce mois
              </div>
            </div>
          </div>
        </div>

        <!-- Conteneur pour répartition par rôle et liste des agents -->
        <div class="agents-distribution-container">
          <!-- Répartition par rôle -->
          <div class="role-breakdown">
            <h4>Répartition par Rôle</h4>
            <div class="role-list scrollable-list">
              <div v-for="(count, role) in agentsStats.parRole" :key="role" class="role-item">
                <span class="role-name">{{ role }}</span>
                <div class="role-bar">
                  <div class="role-fill" :style="{ width: getRolePercentage(count) + '%' }"></div>
                </div>
                <span class="role-count">{{ count }}</span>
              </div>
            </div>
          </div>

          <!-- Liste des agents -->
          <div class="agents-list-section">
            <h4>Liste des Agents</h4>
            <div class="agents-list scrollable-list">
              <div v-if="agentsList.length === 0" class="no-agents">
                Aucun agent trouvé
              </div>
              <div v-else class="agent-items">
                <div v-for="agent in displayedAgents" :key="agent.id" class="agent-item">
                  <div class="agent-avatar-small">
                    <img v-if="agent.image" :src="getAgentImageUrl(agent.image)"
                      :alt="`Photo de ${agent.prenom} ${agent.nom}`" @error="handleImageError" class="agent-photo">
                    <div v-else class="avatar-placeholder-small">
                      <i class="fas fa-user"></i>
                    </div>
                  </div>
                  <div class="agent-details">
                    <div class="agent-name">{{ agent.prenom }} {{ agent.nom }}</div>
                    <div class="agent-role">{{ agent.role || 'Non spécifié' }}</div>
                    <div class="agent-secondary-info">
                      <span class="agent-matricule">{{ agent.matricule }}</span>
                      <span class="agent-separator">•</span>
                      <span class="agent-entreprise">{{ agent.entreprise }}</span>
                    </div>
                  </div>
                  <div class="agent-status" :class="getAgentStatus(agent)">
                    {{ getAgentStatusText(agent) }}
                  </div>
                </div>
              </div>
            </div>
            <div v-if="agentsList.length > maxDisplayedAgents" class="agents-list-footer">
              <button class="view-more-btn" @click="showAllAgents = !showAllAgents">
                {{ showAllAgents ? 'Voir moins' : `Voir tout (${agentsList.length})` }}
              </button>
            </div>
          </div>
        </div>

        <!-- Actions rapides pour les agents -->
        <div class="agents-quick-actions">
          <button @click="ouvrirGestionAgents" class="quick-action-btn primary-btn">
            <i class="fas fa-users"></i>
            Gestion des Agents
          </button>
          <button @click="genererRapportAgents" class="quick-action-btn secondary-btn">
            <i class="fas fa-chart-bar"></i>
            Rapport Agents
          </button>
        </div>
      </section>

      <!-- ============ SECTION PLANNING AMÉLIORÉE ============ -->
      <section class="section-planning">
        <div class="section-header">
          <div class="section-title">
            <div class="title-icon planning">📅</div>
            <h2>Statistiques Planning</h2>
            <span v-if="activePlanningFilters" class="filter-badge">
              Filtres actifs
            </span>
          </div>
          <div class="planning-period-info">
            <span v-if="currentPlanningPeriod" class="period-display">
              📅 {{ currentPlanningPeriod }}
            </span>
            <div class="last-update">
              Dernière mise à jour: {{ lastUpdate }}
            </div>
          </div>
        </div>

        <!-- Indicateur de filtrage -->
        <div v-if="activePlanningFilters" class="active-filters-alert">
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            Affichage des données filtrées :
            <strong>{{ activePlanningFiltersText }}</strong>
            <button @click="clearPlanningFilters" class="btn-clear-filters">
              <i class="fas fa-times"></i> Effacer les filtres
            </button>
          </div>
        </div>

        <!-- États conditionnels -->
        <div v-if="!planningDataLoaded" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Chargement des données planning...</p>
        </div>

        <div v-else-if="planningData && planningData.length > 0" class="planning-content">
          <!-- Informations de période -->
          <div class="period-info-card">
            <div class="period-info-content">
              <div class="period-item">
                <i class="fas fa-calendar-alt"></i>
                <div class="period-details">
                  <div class="period-label">Période affichée</div>
                  <div class="period-value">{{ currentPlanningPeriod }}</div>
                </div>
              </div>
              <div class="period-item">
                <i class="fas fa-users"></i>
                <div class="period-details">
                  <div class="period-label">Agents uniques</div>
                  <div class="period-value">{{ uniqueAgentsCount }}</div>
                </div>
              </div>
              <div class="period-item">
                <i class="fas fa-filter"></i>
                <div class="period-details">
                  <div class="period-label">Filtres appliqués</div>
                  <div class="period-value">{{ activePlanningFilters ? 'Oui' : 'Non' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cartes de métriques principales du planning -->
          <div class="planning-metrics-grid">
            <div class="metric-card total-planned">
              <div class="metric-icon">
                <i class="fas fa-calendar-check"></i>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ uniqueAgentsCount }}</div>
                <div class="metric-label">Agents Uniques</div>
                <div class="metric-trend">
                  <i class="fas fa-chart-line"></i>
                  {{ (planningStats.avgHours || 0).toFixed(1) }}h moyenne
                </div>
              </div>
            </div>

            <div class="metric-card total-hours">
              <div class="metric-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ planningStats.totalHours || 0 }}</div>
                <div class="metric-label">Heures Total</div>
                <div class="metric-subtext">
                  Programmation {{ getPeriodTypeText() }}
                </div>
              </div>
            </div>

            <div class="metric-card day-shifts">
              <div class="metric-icon">
                <i class="fas fa-sun"></i>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ planningStats.dayShift || 0 }}</div>
                <div class="metric-label">Shifts Jour</div>
                <div class="metric-trend">
                  <i class="fas fa-user-clock"></i>
                  {{ getShiftPercentage('JOUR') }}% du total
                </div>
              </div>
            </div>

            <div class="metric-card night-shifts">
              <div class="metric-icon">
                <i class="fas fa-moon"></i>
              </div>
              <div class="metric-content">
                <div class="metric-value">{{ planningStats.nightShift || 0 }}</div>
                <div class="metric-label">Shifts Nuit</div>
                <div class="metric-subtext">
                  {{ getShiftPercentage('NUIT') }}% du total
                </div>
              </div>
            </div>
          </div>

          <!-- Répartition des shifts -->
          <div class="shifts-breakdown">
            <h4>Répartition des Types de Shift</h4>
            <div class="shifts-grid">
              <div v-for="(count, shift) in planningStats.shiftCounts || {}" :key="shift" class="shift-item">
                <div class="shift-badge" :class="getShiftBadgeClass(shift)">
                  <div class="shift-count">{{ count }}</div>
                  <div class="shift-name">{{ formatShiftName(shift) }}</div>
                  <div class="shift-percentage">{{ getShiftTypePercentage(count) }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions rapides pour le planning -->
          <div class="planning-quick-actions">
            <button @click="ouvrirGestionPlanning" class="quick-action-btn primary-btn">
              <i class="fas fa-calendar-alt"></i>
              Gestion Planning
            </button>
            <button @click="genererRapportPlanning" class="quick-action-btn export-excel-btn">
              <i class="fas fa-file-export"></i>
              Exporter Planning
            </button>
            <button @click="ouvrirStatistiquesPlanning" class="quick-action-btn secondary-btn">
              <i class="fas fa-chart-bar"></i>
              Statistiques Avancées
            </button>
          </div>
        </div>

        <!-- État vide -->
        <div v-else class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>Aucun planning disponible</h3>
          <p>Commencez par créer des plannings dans la section dédiée.</p>
          <button @click="ouvrirGestionPlanning" class="btn-primary">
            <i class="fas fa-calendar-plus"></i>
            Créer un planning
          </button>
        </div>
      </section>

      <!-- ============ SECTION 4: STATISTIQUES GÉNÉRALES ============ -->
      <section class="section-stats">
        <div class="section-header">
          <div class="section-title">
            <div class="title-icon stats">📈</div>
            <h2>Statistiques Générales</h2>
          </div>
          <select v-model="selectedPeriod" class="period-select">
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>

        <div class="stats-grid">
          <div class="stat-card general">
            <div class="stat-header">
              <i class="fas fa-users"></i>
              <h3>Effectifs</h3>
            </div>
            <div class="stat-content">
              <div class="stat-item">
                <span class="stat-label">Agents Total</span>
                <span class="stat-value">{{ agentsStats.totalAgents }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Nouveaux Ce Mois</span>
                <span class="stat-value">{{ agentsStats.nouveauxAgents }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Rôles Actifs</span>
                <span class="stat-value">{{ agentsStats.rolesActifs }}</span>
              </div>
            </div>
          </div>

          <div class="stat-card performance">
            <div class="stat-header">
              <i class="fas fa-chart-line"></i>
              <h3>Performance</h3>
            </div>
            <div class="stat-content">
              <div class="stat-item">
                <span class="stat-label">Taux de Présence</span>
                <span class="stat-value">{{ presenceStats.tauxPresence }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Heures Moyennes</span>
                <span class="stat-value">{{ presenceStats.moyenneHeures }}h</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Pointages Total</span>
                <span class="stat-value">{{ presenceStats.totalPointages }}</span>
              </div>
            </div>
          </div>

          <div class="stat-card planning">
            <div class="stat-header">
              <i class="fas fa-calendar-alt"></i>
              <h3>Planning</h3>
            </div>
            <div class="stat-content">
              <div class="stat-item">
                <span class="stat-label">Agents Uniques</span>
                <span class="stat-value">{{ uniqueAgentsCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Heures Total</span>
                <span class="stat-value">{{ planningStats.totalHours }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Moyenne Heures</span>
                <span class="stat-value">{{ planningStats.avgHours?.toFixed(1) || 0 }}h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ MODAL RAPPORT PRÉSENCE ============ -->
      <div v-if="showReportOptions" class="report-options-modal">
        <div class="modal-overlay" @click.self="closeReportOptions">
          <div class="modal-content">
            <div class="modal-header">
              <h3>📊 Générer un rapport de présence</h3>
              <button @click="closeReportOptions" class="btn-close">×</button>
            </div>

            <div class="report-options">
              <div class="option-group">
                <label>Format du rapport:</label>
                <select v-model="selectedReportFormat" class="format-select">
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
              </div>

              <div class="option-group">
                <label>Filtrer par campagne:</label>
                <select v-model="selectedCampagneFilter" class="campagne-select">
                  <option value="">Toutes les campagnes</option>
                  <option value="Standard">Standard</option>
                  <option value="Medadom">Medadom</option>
                  <option value="Klekoon">Klekoon</option>
                  <option value="Standard T">Standard T</option>
                  <option value="Commerciale">Commerciale</option>
                  <option value="Stagiaire">Stagiaire</option>
                </select>
              </div>

              <div class="option-group">
                <label>Période:</label>
                <select v-model="selectedReportPeriod" class="period-select">
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </select>
              </div>

              <div class="option-group">
                <label>Options:</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportOptions.includeAgentDetails" checked>
                    Détails des agents
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportOptions.includeHours" checked>
                    Heures travaillées
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="reportOptions.includeStats">
                    Statistiques détaillées
                  </label>
                </div>
              </div>

              <div class="action-buttons">
                <button @click="closeReportOptions" class="btn-cancel">
                  Annuler
                </button>
                <button @click="generatePresenceReportWithOptions" class="btn-generate" :disabled="generatingReport">
                  <span v-if="generatingReport" class="loading-spinner"></span>
                  {{ generatingReport ? 'Génération...' : 'Générer le rapport' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ MODAL RAPPORT AGENTS ============ -->
      <div v-if="showAgentReportOptions" class="report-options-modal">
        <div class="modal-overlay" @click.self="closeAgentReportOptions">
          <div class="modal-content">
            <div class="modal-header">
              <h3>👨‍💼 Générer un rapport des agents</h3>
              <button @click="closeAgentReportOptions" class="btn-close">×</button>
            </div>

            <div class="report-options">
              <div class="option-group">
                <label>Format du rapport:</label>
                <select v-model="selectedAgentReportFormat" class="format-select">
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
              </div>

              <div class="option-group">
                <label>Filtrer par rôle:</label>
                <select v-model="selectedRoleFilter" class="role-select">
                  <option value="">Tous les rôles</option>
                  <option v-for="role in Object.keys(agentsStats.parRole)" :key="role" :value="role">
                    {{ role }}
                  </option>
                </select>
              </div>

              <div class="option-group">
                <label>Options:</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="agentReportOptions.includePersonalInfo" checked>
                    Informations personnelles
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="agentReportOptions.includeContact" checked>
                    Coordonnées
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="agentReportOptions.includeStats">
                    Statistiques globales
                  </label>
                </div>
              </div>

              <div class="action-buttons">
                <button @click="closeAgentReportOptions" class="btn-cancel">
                  Annuler
                </button>
                <button @click="generateAgentReportWithOptions" class="btn-generate" :disabled="generatingAgentReport">
                  <span v-if="generatingAgentReport" class="loading-spinner"></span>
                  {{ generatingAgentReport ? 'Génération...' : 'Générer le rapport' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ MODAL RAPPORT PLANNING ============ -->
      <div v-if="showPlanningReportOptions" class="report-options-modal">
        <div class="modal-overlay" @click.self="closePlanningReportOptions">
          <div class="modal-content">
            <div class="modal-header">
              <h3>📅 Générer un rapport de planning</h3>
              <button @click="closePlanningReportOptions" class="btn-close">×</button>
            </div>

            <div class="report-options">
              <div class="option-group">
                <label>Format du rapport:</label>
                <select v-model="selectedPlanningReportFormat" class="format-select">
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="excel">Excel (.xlsx)</option>
                </select>
              </div>

              <div class="option-group">
                <label>Période:</label>
                <select v-model="selectedPlanningPeriod" class="period-select">
                  <option value="current">Semaine actuelle</option>
                  <option value="last">Semaine précédente</option>
                  <option value="month">Ce mois</option>
                  <option value="all">Toutes les données</option>
                </select>
              </div>

              <div class="option-group">
                <label>Options:</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="planningReportOptions.includeShifts" checked>
                    Détails des shifts
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="planningReportOptions.includeHours" checked>
                    Heures programmées
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="planningReportOptions.includeStats">
                    Statistiques détaillées
                  </label>
                </div>
              </div>

              <div class="action-buttons">
                <button @click="closePlanningReportOptions" class="btn-cancel">
                  Annuler
                </button>
                <button @click="generatePlanningReportWithOptions" class="btn-generate"
                  :disabled="generatingPlanningReport">
                  <span v-if="generatingPlanningReport" class="loading-spinner"></span>
                  {{ generatingPlanningReport ? 'Génération...' : 'Générer le rapport' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="section-primes">
        <div class="section-header">
          <div class="section-title">
            <div class="title-icon primes">💰</div>
            <h2>Gestion des Primes</h2>
          </div>
          <div class="last-update">
            Dernière mise à jour: {{ lastUpdate }}
          </div>
        </div>

        <!-- Indicateurs des primes -->
        <div class="primes-metrics-grid">
          <div class="metric-card total-primes">
            <div class="metric-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ primesStats.montantTotal }}</div>
              <div class="metric-label">Montant Total Primes</div>
              <div class="metric-trend">
                <i class="fas fa-chart-line"></i>
                {{ primesStats.nombreBeneficiaires }} bénéficiaires
              </div>
            </div>
          </div>

          <div class="metric-card primes-appels">
            <div class="metric-icon">
              <i class="fas fa-phone"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ primesStats.totalAppels }}</div>
              <div class="metric-label">Total Appels Prime</div>
              <div class="metric-subtext">
                {{ primesStats.montantAppels }} Ar générés
              </div>
            </div>
          </div>

          <div class="metric-card primes-tmc">
            <div class="metric-icon">
              <i class="fas fa-chart-bar"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ primesStats.totalTMC }}</div>
              <div class="metric-label">Total TMC</div>
              <div class="metric-subtext">
                {{ primesStats.montantTMC }} Ar générés
              </div>
            </div>
          </div>

          <div class="metric-card primes-moyenne">
            <div class="metric-icon">
              <i class="fas fa-calculator"></i>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ primesStats.moyennePrime }}</div>
              <div class="metric-label">Moyenne Prime/Agent</div>
              <div class="metric-trend">
                <i class="fas fa-user"></i>
                Sur {{ primesStats.agentsEligibles }} agents
              </div>
            </div>
          </div>
        </div>

        <!-- Contrôles des primes -->
        <div class="primes-controls">
          <div class="control-group">
            <label>📅 Période des Primes:</label>
            <input type="month" v-model="selectedPrimeMonth" class="month-input" @change="loadPrimesData">
          </div>

          <div class="prices-controls">
            <div class="price-control">
              <label>Prix par Appel (Ar):</label>
              <input type="number" v-model="primeAppPrix" class="price-input" min="0"
                @change="updatePrimesCalculations">
            </div>
            <div class="price-control">
              <label>Prix par TMC (Ar):</label>
              <input type="number" v-model="primeTmcPrix" class="price-input" min="0"
                @change="updatePrimesCalculations">
            </div>
          </div>
        </div>

        <!-- Résumé des primes -->
        <div class="primes-summary">
          <h4>📊 Synthèse des Primes - {{ formattedPrimeMonth }}</h4>
          <div class="summary-table-container scrollable-list">
            <table class="primes-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Total Appels</th>
                  <th>Total TMC</th>
                  <th>Montant Appels</th>
                  <th>Montant TMC</th>
                  <th>Montant Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="prime in primesSummary" :key="prime.agent" @click="showPrimeDetails(prime.agent)"
                  class="prime-row">
                  <td class="agent-name">{{ prime.agent }}</td>
                  <td class="numeric">{{ prime.totAppels }}</td>
                  <td class="numeric">{{ prime.totTMC }}</td>
                  <td class="numeric">{{ formatAr(prime.montantAppels) }}</td>
                  <td class="numeric">{{ formatAr(prime.montantTMC) }}</td>
                  <td class="numeric total-amount">{{ formatAr(prime.montantTotal) }}</td>
                </tr>
              </tbody>
              <tfoot v-if="primesSummary.length > 0">
                <tr class="primes-total">
                  <td><strong>TOTAL</strong></td>
                  <td class="numeric"><strong>{{ primesStats.totalAppels }}</strong></td>
                  <td class="numeric"><strong>{{ primesStats.totalTMC }}</strong></td>
                  <td class="numeric"><strong>{{ formatAr(primesStats.montantAppels) }}</strong></td>
                  <td class="numeric"><strong>{{ formatAr(primesStats.montantTMC) }}</strong></td>
                  <td class="numeric total-amount"><strong>{{ formatAr(primesStats.montantTotal) }}</strong></td>
                </tr>
              </tfoot>
            </table>

            <div v-if="primesSummary.length === 0" class="no-primes-data">
              <div class="no-data-icon">📭</div>
              <p>Aucune donnée de prime disponible</p>
              <small>Sélectionnez une période ou importez des données</small>
            </div>
          </div>
        </div>

        <!-- Détails de l'agent sélectionné -->
        <div v-if="selectedPrimeAgent" class="prime-details">
          <h4>📋 Détails des primes pour {{ selectedPrimeAgent }}</h4>
          <div class="details-table-container scrollable-list">
            <table class="details-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nom</th>
                  <th>Appels</th>
                  <th>Montant Appels</th>
                  <th>Log</th>
                  <th>TMC</th>
                  <th>Montant TMC</th>
                  <th>Shift</th>
                  <th>Remarque</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(detail, index) in primeAgentDetails" :key="index">
                  <td class="numeric">{{ index + 1 }}</td>
                  <td>{{ detail.nom }}</td>
                  <td class="numeric">{{ detail.nombreAppel }}</td>
                  <td class="numeric">{{ formatAr(detail.montantAppels) }}</td>
                  <td>{{ detail.log }}</td>
                  <td class="numeric">{{ detail.tmc }}</td>
                  <td class="numeric">{{ formatAr(detail.montantTMC) }}</td>
                  <td>{{ detail.shift }}</td>
                  <td>{{ detail.remarque }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button @click="selectedPrimeAgent = null" class="btn-close-details">
            <i class="fas fa-times"></i>
            Fermer les détails
          </button>
        </div>

        <!-- Actions rapides pour les primes -->
        <div class="primes-quick-actions0">
          <button @click="ouvrirGestionPrimes" class="quick-action-btn primary-btn">
            <i class="fas fa-file-upload"></i>
            Importer Données Primes
          </button>
          <button @click="exportPrimesExcel" class="quick-action-btn export-excel-btn"
            :disabled="primesSummary.length === 0">
            <i class="fas fa-file-excel"></i>
            Exporter Excel
          </button>
          <button @click="exportPrimesPDF" class="quick-action-btn export-pdf-btn"
            :disabled="primesSummary.length === 0">
            <i class="fas fa-file-pdf"></i>
            Exporter PDF
          </button>
        </div>
      </section>
    </div>
  </PageModel>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import PageModel from '@/components/organisms/PageModel.vue'
import { dashboardService, presenceService } from '@/services/presenceApi'
import { AgentColarysService } from '@/services/AgentColarysService'
import { usePlanningStore } from '@/stores/planningStore'
import { PlanningService } from '@/services/PlanningService'

// ============ FONCTIONS UTILITAIRES POUR LES PRIMES ============
// Ces fonctions doivent être définies AVANT le setup()

// Obtenir le mois courant (YYYY-MM)
const getCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// Formater les montants en Ariary
const formatAr = (amount) => {
  if (!amount && amount !== 0) return '0 Ar'
  // Remplacer tous les espaces (normaux et fins) par un espace insécable
  return amount.toLocaleString('fr-FR').replace(/\s/g, '\u00A0') + '\u00A0Ar'
}
// Normaliser les noms d'agents
const normalizeName = (raw) => {
  if (!raw) return ''
  let s = String(raw)
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
  if (/^[0-9]/.test(s) || s === 'TOTAL') return ''
  if (s.startsWith('MAT')) return 'MAT'
  return s
}

export default {
  name: 'Dashboard',
  components: {
    PageModel
  },
  setup() {
    const router = useRouter()
    const agentService = new AgentColarysService()
    const planningStore = usePlanningStore()

    // États principaux
    const loading = ref(false)
    const autoRefresh = ref(true)
    const selectedPeriod = ref('today')

    // Données temps réel
    const currentTime = ref('')
    const currentDate = ref('')
    const lastUpdate = ref('')
    const isOnline = ref(true)

    // ============ ÉTATS POUR LES PRÉSENCES ============
    const presenceStats = ref({
      presentsAujourdhui: 0,
      enAttenteSortie: 0,
      heuresTravaillees: 0,
      totalPointages: 0,
      entreesAujourdhui: 0,
      sortiesAujourdhui: 0,
      moyenneHeures: 0,
      tauxPresence: 0,
      parCampagne: {}
    })

    const agentsList = ref([])
    const showAllAgents = ref(false);
    const maxDisplayedAgents = ref(5);

    // ============ CORRECTION : Logique d'affichage des agents ============
    const displayedAgents = computed(() => {
      if (showAllAgents.value) {
        return agentsList.value;
      }
      return agentsList.value.slice(0, maxDisplayedAgents.value);
    })

    // ============ États pour les badgeuses récentes ============
    const showAllCheckins = ref(false);
    const maxDisplayedCheckins = ref(5);

    // ============ CORRECTION : Logique d'affichage des badgeuses ============
    const displayedCheckins = computed(() => {
      if (showAllCheckins.value) {
        return recentCheckins.value;
      }
      return recentCheckins.value.slice(0, maxDisplayedCheckins.value);
    })

    // ============ NOUVEAUX ÉTATS POUR LES PRIMES ============
    const selectedPrimeMonth = ref(getCurrentMonth()) // MAINTENANT getCurrentMonth EST DÉFINI
    const primeAppPrix = ref(15)
    const primeTmcPrix = ref(50)
    const primesData = ref({})
    const primesSummary = ref([])
    const selectedPrimeAgent = ref(null)
    const primeAgentDetails = ref([])

    // ============ MÉTHODES UTILITAIRES ============
    const getRolePercentage = (count) => {
      const total = agentsStats.value.totalAgents
      return total > 0 ? Math.round((count / total) * 100) : 0
    }

    const getCampaignPercentage = (count) => {
      const total = presenceStats.value.presentsAujourdhui
      return total > 0 ? Math.round((count / total) * 100) : 0
    }

    const totalAgentsToday = computed(() => {
      return presenceStats.value.presentsAujourdhui || 0
    })

    const getTrendClass = (trend) => {
      return trend >= 0 ? 'positive' : 'negative'
    }

    const getTrendIcon = (trend) => {
      return trend >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'
    }

    const getAlertIcon = (level) => {
      const icons = {
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
        critical: 'fas fa-skull-crossbones'
      }
      return icons[level] || 'fas fa-info-circle'
    }

    const getInitials = (name) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    }

    const toggleAutoRefresh = () => {
      autoRefresh.value = !autoRefresh.value
    }

    const getAgentStatus = (agent) => {
      const isPresent = recentCheckins.value.some(checkin =>
        checkin.agentName.includes(agent.nom) && checkin.agentName.includes(agent.prenom)
      )
      return isPresent ? 'present' : 'absent'
    }

    const getAgentStatusText = (agent) => {
      const status = getAgentStatus(agent)
      return status === 'present' ? '🟢 Présent' : '🔴 Absent'
    }

    const getAgentImageUrl = (imagePath) => {
      if (!imagePath) {
        return '/default-avatar.png';
      }
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      return `http://localhost:3000${imagePath}`;
    };

    const handleImageError = (event) => {
      const parent = event.target.parentElement
      parent.innerHTML = '<div class="avatar-placeholder-small"><i class="fas fa-user"></i></div>'
    }

    // ============ NOUVELLES MÉTHODES POUR LE PLANNING ============
    const getShiftPercentage = (shiftType) => {
      const totalShifts = (planningStats.value.dayShift || 0) + (planningStats.value.nightShift || 0)
      if (totalShifts === 0) return 0

      const shiftCount = shiftType === 'JOUR' ? (planningStats.value.dayShift || 0) : (planningStats.value.nightShift || 0)
      return Math.round((shiftCount / totalShifts) * 100)
    }

    const getShiftTypePercentage = (count) => {
      const shiftCounts = planningStats.value.shiftCounts || {}
      const totalShifts = Object.values(shiftCounts).reduce((sum, val) => sum + val, 0)
      return totalShifts > 0 ? Math.round((count / totalShifts) * 100) : 0
    }

    const getShiftBadgeClass = (shift) => {
      const shiftUpper = shift.toUpperCase();
      if (shiftUpper.includes('MAT5')) return 'bg-mat5';
      if (shiftUpper.includes('MAT8')) return 'bg-mat8';
      if (shiftUpper.includes('MAT9')) return 'bg-mat9';
      if (shiftUpper === 'JOUR') return 'bg-jour';
      if (shiftUpper === 'NUIT') return 'bg-nuit';
      if (shiftUpper === 'OFF') return 'bg-off';
      if (shiftUpper === 'CONGE' || shiftUpper === 'CONGÉ') return 'bg-conge';
      if (shiftUpper === 'FORMATION') return 'bg-formation';
      if (shiftUpper === '-' || shiftUpper === 'ABSENT') return 'bg-absent';
      if (shiftUpper === 'MALADE') return 'bg-malade';
      return 'bg-light';
    }

    const formatShiftName = (shift) => {
      const shiftMap = {
        'MAT5': 'MAT 5h',
        'MAT8': 'MAT 8h',
        'MAT9': 'MAT 9h',
        'JOUR': 'Jour',
        'NUIT': 'Nuit',
        'OFF': 'Off',
        'CONGE': 'Congé',
        'FORMATION': 'Formation',
        '-': 'Absent',
        'ABSENT': 'Absent',
        'MALADE': 'Malade'
      };
      return shiftMap[shift] || shift;
    }

    // ============ NOUVELLES COMPUTED PROPERTIES POUR LE PLANNING ============
    const currentPlanningPeriod = computed(() => {
      if (!activePlanningFilters.value) {
        return 'Toutes les périodes';
      }

      const filters = activePlanningFilters.value;
      const parts = [];

      if (filters.selectedYear && filters.selectedYear !== 'all') {
        parts.push(`Année ${filters.selectedYear}`);
      }
      if (filters.selectedMonth && filters.selectedMonth !== 'all') {
        parts.push(formatMonthForDisplay(filters.selectedMonth));
      }
      if (filters.selectedWeek && filters.selectedWeek !== 'all') {
        parts.push(`Semaine ${filters.selectedWeek}`);
      }

      return parts.join(' - ') || 'Période actuelle';
    });

    const uniqueAgentsCount = computed(() => {
      if (!planningData.value || planningData.value.length === 0) return 0;

      // Utiliser un Set pour obtenir les agents uniques basés sur agent_name
      const uniqueAgentNames = new Set(
        planningData.value
          .filter(item => item.agent_name && item.agent_name.trim() !== '')
          .map(item => item.agent_name.trim().toLowerCase())
      );

      return uniqueAgentNames.size;
    });

    const getPeriodTypeText = () => {
      if (!activePlanningFilters.value) return 'hebdomadaire';

      const filters = activePlanningFilters.value;
      if (filters.selectedMonth && filters.selectedMonth !== 'all') {
        return 'mensuelle';
      }
      if (filters.selectedWeek && filters.selectedWeek !== 'all') {
        return 'hebdomadaire';
      }
      return 'globale';
    };

    // ============ ÉTATS POUR LES AGENTS ============
    const agentsStats = ref({
      totalAgents: 0,
      nouveauxAgents: 0,
      rolesActifs: 0,
      tauxCompletion: 0,
      parRole: {}
    })

    const planningStats = ref({
      totalAgents: 0,
      totalHours: 0,
      avgHours: 0,
      present: 0,
      absent: 0,
      dayShift: 0,
      nightShift: 0,
      shiftCounts: {}
    })

    // Données temps réel
    const recentCheckins = ref([])
    const alerts = ref([])

    // ============ RAPPORT PRÉSENCE ============
    const showReportOptions = ref(false)
    const selectedReportFormat = ref('pdf')
    const selectedCampagneFilter = ref('')
    const selectedReportPeriod = ref('today')
    const generatingReport = ref(false)
    const reportOptions = ref({
      includeAgentDetails: true,
      includeHours: true,
      includeStats: true
    })

    // ============ RAPPORT AGENTS ============
    const showAgentReportOptions = ref(false)
    const selectedAgentReportFormat = ref('pdf')
    const selectedRoleFilter = ref('')
    const generatingAgentReport = ref(false)
    const agentReportOptions = ref({
      includePersonalInfo: true,
      includeContact: true,
      includeStats: true
    })

    // ============ RAPPORT PLANNING ============
    const showPlanningReportOptions = ref(false)
    const selectedPlanningReportFormat = ref('pdf')
    const selectedPlanningPeriod = ref('current')
    const generatingPlanningReport = ref(false)
    const planningReportOptions = ref({
      includeShifts: true,
      includeHours: true,
      includeStats: true
    })

    // ============ CORRECTION : Données de planning persistantes ============
    const activePlanningFilters = ref(null)
    const planningData = ref([])
    const planningDataLoaded = ref(false)

    // Computed pour l'affichage des filtres actifs
    const activePlanningFiltersText = computed(() => {
      if (!activePlanningFilters.value) return ''

      const filters = activePlanningFilters.value
      const parts = []

      if (filters.selectedYear && filters.selectedYear !== 'all') {
        parts.push(`Année: ${filters.selectedYear}`)
      }
      if (filters.selectedMonth && filters.selectedMonth !== 'all') {
        parts.push(`Mois: ${formatMonthForDisplay(filters.selectedMonth)}`)
      }
      if (filters.selectedWeek && filters.selectedWeek !== 'all') {
        parts.push(`Semaine: ${filters.selectedWeek}`)
      }
      if (filters.searchQuery) {
        parts.push(`Recherche: "${filters.searchQuery}"`)
      }
      if (filters.selectedFilter && filters.selectedFilter !== 'all') {
        parts.push(`Filtre: ${filters.selectedFilter}`)
      }

      return parts.join(' | ')
    })

    // ============ COMPUTED POUR LES PRIMES ============
    // Statistiques calculées des primes
    const primesStats = computed(() => {
      if (primesSummary.value.length === 0) {
        return {
          montantTotal: 0,
          nombreBeneficiaires: 0,
          totalAppels: 0,
          montantAppels: 0,
          totalTMC: 0,
          montantTMC: 0,
          moyennePrime: 0,
          agentsEligibles: 0
        }
      }

      const totalAppels = primesSummary.value.reduce((sum, prime) => sum + prime.totAppels, 0)
      const totalTMC = primesSummary.value.reduce((sum, prime) => sum + prime.totTMC, 0)
      const montantAppels = primesSummary.value.reduce((sum, prime) => sum + prime.montantAppels, 0)
      const montantTMC = primesSummary.value.reduce((sum, prime) => sum + prime.montantTMC, 0)
      const montantTotal = montantAppels + montantTMC
      const moyennePrime = primesSummary.value.length > 0 ? Math.round(montantTotal / primesSummary.value.length) : 0

      return {
        montantTotal: formatAr(montantTotal),
        nombreBeneficiaires: primesSummary.value.length,
        totalAppels,
        montantAppels,
        totalTMC,
        montantTMC,
        moyennePrime: formatAr(moyennePrime),
        agentsEligibles: primesSummary.value.length
      }
    })

    // Formatage du mois affiché
    const formattedPrimeMonth = computed(() => {
      if (!selectedPrimeMonth.value) return 'Période non spécifiée'
      const [year, month] = selectedPrimeMonth.value.split('-')
      const monthNames = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ]
      return `${monthNames[parseInt(month) - 1]} ${year}`
    })

    // ============ MÉTHODES POUR LES PRIMES ============
    // Charger les données de primes
    const loadPrimesData = () => {
      try {
        const raw = localStorage.getItem(`data_${selectedPrimeMonth.value}`)
        if (!raw) {
          primesData.value = {}
          primesSummary.value = []
          console.log(`ℹ️ Aucune donnée de prime pour ${selectedPrimeMonth.value}`)
          return
        }

        primesData.value = JSON.parse(raw)
        calculatePrimesSummary()
        console.log(`✅ Données primes chargées: ${Object.keys(primesData.value).length} agents`)
      } catch (error) {
        console.error('❌ Erreur chargement données primes:', error)
        primesData.value = {}
        primesSummary.value = []
      }
    }

    // Calculer le résumé des primes
    const calculatePrimesSummary = () => {
      const summaryArray = Object.entries(primesData.value).map(([agent, entries]) => {
        const totAppels = entries.reduce((s, e) => s + e.nombreAppel, 0)
        const totTMC = entries.reduce((s, e) => s + e.tmc, 0)
        const montantAppels = totAppels * primeAppPrix.value
        const montantTMC = totTMC * primeTmcPrix.value
        return {
          agent,
          totAppels,
          totTMC,
          montantAppels,
          montantTMC,
          montantTotal: montantAppels + montantTMC
        }
      })

      // Trier par montant total décroissant
      primesSummary.value = summaryArray.sort((a, b) => b.montantTotal - a.montantTotal)
    }

    // Mettre à jour les calculs quand les prix changent
    const updatePrimesCalculations = () => {
      if (primesData.value && Object.keys(primesData.value).length > 0) {
        calculatePrimesSummary()
      }
    }

    // Afficher les détails d'un agent
    const showPrimeDetails = (agent) => {
      selectedPrimeAgent.value = agent
      primeAgentDetails.value = primesData.value[agent] || []

      // Calculer les montants pour chaque détail
      primeAgentDetails.value = primeAgentDetails.value.map(detail => ({
        ...detail,
        montantAppels: detail.nombreAppel * primeAppPrix.value,
        montantTMC: detail.tmc * primeTmcPrix.value
      }))
    }

    // Navigation vers la page de gestion des primes
    const ouvrirGestionPrimes = () => {
      router.push('/prime')
    }

    // Exporter en Excel
    const exportPrimesExcel = async () => {
      try {
        if (primesSummary.value.length === 0) {
          alert('❌ Aucune donnée à exporter')
          return
        }

        const XLSX = await import('xlsx')
        const wb = XLSX.utils.book_new()

        // Feuille de résumé
        const sumData = [
          ['Agent', 'Total Appels', 'Total TMC', 'Montant Appels', 'Montant TMC', 'Montant Total']
        ]

        primesSummary.value.forEach(prime => {
          sumData.push([
            prime.agent,
            prime.totAppels,
            prime.totTMC,
            prime.montantAppels,
            prime.montantTMC,
            prime.montantTotal
          ])
        })

        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumData), "Résumé Primes")

        // Feuilles par agent
        for (const ag in primesData.value) {
          const data = [['Nom', 'Appels', 'Montant Appels', 'Log', 'TMC', 'Montant TMC', 'Shift', 'Remarque']]
          primesData.value[ag].forEach(e => {
            data.push([
              e.nom,
              e.nombreAppel,
              e.nombreAppel * primeAppPrix.value,
              e.log,
              e.tmc,
              e.tmc * primeTmcPrix.value,
              e.shift,
              e.remarque
            ])
          })
          XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), ag.substring(0, 31))
        }

        XLSX.writeFile(wb, `Primes_${selectedPrimeMonth.value}.xlsx`)
        alert(`✅ Fichier Excel exporté: Primes_${selectedPrimeMonth.value}.xlsx`)

      } catch (error) {
        console.error('❌ Erreur export Excel primes:', error)
        alert('❌ Erreur lors de l\'export Excel')
      }
    }

    // Exporter en PDF
    // Exporter en PDF
    // Exporter en PDF
const exportPrimesPDF = async () => {
  try {
    if (primesSummary.value.length === 0) {
      alert('❌ Aucune donnée à exporter')
      return
    }

    const doc = new jsPDF()

    // Fonction de formatage robuste pour le PDF
    const formatArForPdf = (amount) => {
      if (!amount && amount !== 0) return '0 Ar'
      
      // Convertir en nombre entier
      const num = Math.round(Number(amount))
      
      // Formater manuellement avec des espaces
      let formatted = num.toString()
      // Ajouter des espaces tous les 3 chiffres en partant de la fin
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
      
      return formatted + ' Ar'
    }

    // En-tête
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 40)
    doc.text('RAPPORT DES PRIMES', 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`Période: ${formattedPrimeMonth.value}`, 105, 30, { align: 'center' })

    // Informations
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 20, 45)
    doc.text(`Prix Appel: ${primeAppPrix.value} Ar`, 20, 52)
    doc.text(`Prix TMC: ${primeTmcPrix.value} Ar`, 20, 59)
    doc.text(`Bénéficiaires: ${primesStats.value.nombreBeneficiaires}`, 150, 45)
    doc.text(`Montant total: ${formatArForPdf(primesStats.value.montantTotal.replace(/[^0-9]/g, ''))}`, 150, 52)

    // Tableau des primes
    const headers = [['AGENT', 'APPELS', 'TMC', 'MONTANT APPELS', 'MONTANT TMC', 'TOTAL']]

    const data = primesSummary.value.map(prime => [
      prime.agent,
      prime.totAppels.toString(),
      prime.totTMC.toString(),
      formatArForPdf(prime.montantAppels),
      formatArForPdf(prime.montantTMC),
      formatArForPdf(prime.montantTotal)
    ])

    // Générer le tableau avec des options spécifiques
    autoTable(doc, {
      startY: 65,
      head: headers,
      body: data,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [40, 40, 40],
        font: 'helvetica',
        fontStyle: 'normal',
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [139, 69, 19],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto', halign: 'right' },
        2: { cellWidth: 'auto', halign: 'right' },
        3: { cellWidth: 'auto', halign: 'right' },
        4: { cellWidth: 'auto', halign: 'right' },
        5: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' }
      },
      margin: { top: 65 },
      tableLineWidth: 0.1,
      tableLineColor: [100, 100, 100]
    })

    // Pied de page
    const finalY = doc.lastAutoTable.finalY + 10
    const pageHeight = doc.internal.pageSize.height
    
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Document généré automatiquement par le système Colarys Concept', 105, pageHeight - 10, { align: 'center' })

    doc.save(`Primes_${selectedPrimeMonth.value}.pdf`)
    alert(`✅ Fichier PDF exporté: Primes_${selectedPrimeMonth.value}.pdf`)

  } catch (error) {
    console.error('❌ Erreur export PDF primes:', error)
    alert('❌ Erreur lors de l\'export PDF')
  }
}

    // Charger les filtres depuis le store
    const loadPlanningFiltersFromStore = () => {
      if (planningStore.currentFilters) {
        activePlanningFilters.value = { ...planningStore.currentFilters }
        console.log('✅ Filtres planning chargés depuis le store:', activePlanningFilters.value)
      } else {
        activePlanningFilters.value = null
        console.log('ℹ️ Aucun filtre planning actif')
      }
    }

    // Effacer les filtres
    const clearPlanningFilters = () => {
      activePlanningFilters.value = null
      planningStore.clearCurrentFilters()
      loadPlanningData()
      console.log('🗑️ Filtres planning effacés')
    }

    // Formater le mois pour l'affichage
    const formatMonthForDisplay = (month) => {
      const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ]
      return months[parseInt(month) - 1] || month
    }

    // Mise à jour de l'heure
    const updateTime = () => {
      const now = new Date()
      currentTime.value = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      currentDate.value = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      lastUpdate.value = now.toLocaleString('fr-FR')
    }

    // ============ MODIFICATIONS DANS LE CHARGEMENT INITIAL ============
    const loadAllData = async () => {
      try {
        loading.value = true
        console.log('🔄 Chargement des données du dashboard...')

        await loadPresenceData()
        await loadAgentsData()

        // Charger d'abord les filtres, puis les données planning
        loadPlanningFiltersFromStore()
        await loadPlanningData()

        await loadRealTimeData()

        // Charger les données de primes
        loadPrimesData()

      } catch (error) {
        console.error('❌ Erreur chargement données:', error)
        setDefaultData()
      } finally {
        loading.value = false
      }
    }

    // Chargement des données de présence
    const loadPresenceData = async () => {
      try {
        const stats = await dashboardService.getCalculatedStats()
        presenceStats.value = stats
        console.log('✅ Données de présence chargées:', stats)
      } catch (error) {
        console.error('❌ Erreur chargement présence:', error)
        presenceStats.value = {
          presentsAujourdhui: 0,
          enAttenteSortie: 0,
          heuresTravaillees: 0,
          totalPointages: 0,
          entreesAujourdhui: 0,
          sortiesAujourdhui: 0,
          moyenneHeures: 0,
          tauxPresence: 0,
          parCampagne: {}
        }
      }
    }

    // Méthode pour charger les données des agents
    const loadAgentsData = async () => {
      try {
        const agents = await agentService.getAllAgents()
        agentsList.value = agents
        calculateAgentsStats(agents)
        console.log('✅ Données agents chargées:', agents.length, 'agents')
      } catch (error) {
        console.error('❌ Erreur chargement agents:', error)
        agentsStats.value = { totalAgents: 0, nouveauxAgents: 0, rolesActifs: 0, tauxCompletion: 0, parRole: {} }
        agentsList.value = []
      }
    }

    // ============ CHARGEMENT DES DONNÉES PLANNING AVEC FILTRES ============
    const loadPlanningData = async () => {
      try {
        console.log('🔄 Chargement des données planning avec filtres:', activePlanningFilters.value)

        let filtersToUse = {}

        // Utiliser les filtres actifs s'ils existent
        if (activePlanningFilters.value) {
          filtersToUse = { ...activePlanningFilters.value }
        } else {
          // Sinon, utiliser des filtres vides pour tout charger
          filtersToUse = {
            selectedYear: 'all',
            selectedMonth: 'all',
            selectedWeek: 'all',
            searchQuery: '',
            selectedFilter: 'all'
          }
        }

        // Charger les statistiques avec les filtres
        const stats = await PlanningService.getStats(filtersToUse)

        // Mettre à jour les statistiques avec le nombre d'agents uniques
        const detailedData = await PlanningService.getPlannings(filtersToUse)
        planningData.value = detailedData
        planningDataLoaded.value = true

        // Calculer le nombre d'agents uniques
        const uniqueCount = uniqueAgentsCount.value;

        // Mettre à jour les statistiques avec le nombre d'agents uniques
        planningStats.value = {
          ...stats,
          totalAgents: uniqueCount // Remplacer par le compte d'agents uniques
        }

        console.log('✅ Données planning chargées:', {
          filtres: filtersToUse,
          statistiques: stats,
          agentsUniques: uniqueCount,
          donnees: detailedData.length
        })

        // Si pas de données avec filtres, charger sans filtres
        if (detailedData.length === 0 && Object.keys(filtersToUse).length > 0) {
          console.log('🔄 Aucune donnée avec filtres, tentative sans filtres...')
          const allData = await PlanningService.getPlannings({})
          planningData.value = allData

          // Recalculer le nombre d'agents uniques pour les données sans filtres
          const uniqueCountAll = [...new Set(
            allData
              .filter(item => item.agent_name && item.agent_name.trim() !== '')
              .map(item => item.agent_name.trim().toLowerCase())
          )].size;

          planningStats.value.totalAgents = uniqueCountAll;
          console.log('📋 Données sans filtres:', allData.length, 'agents uniques:', uniqueCountAll)
        }

      } catch (error) {
        console.error('❌ Erreur chargement planning:', error)

        // En cas d'erreur, initialiser avec des données vides
        if (!planningDataLoaded.value) {
          planningStats.value = {
            totalAgents: 0,
            totalHours: 0,
            avgHours: 0,
            present: 0,
            absent: 0,
            dayShift: 0,
            nightShift: 0,
            shiftCounts: {}
          }
          planningData.value = []
        }

        // Afficher une alerte seulement si c'est une erreur critique
        if (!error.message.includes('404') && !error.message.includes('Network Error')) {
          console.warn('⚠️ Erreur non critique lors du chargement planning:', error.message)
        }
      }
    }

    // ============ SURVEILLANCE DES CHANGEMENTS DE FILTRES ============
    watch(
      () => planningStore.currentFilters,
      (newFilters) => {
        console.log('🔄 Changement détecté dans les filtres planning:', newFilters)
        if (newFilters) {
          activePlanningFilters.value = { ...newFilters }
        } else {
          activePlanningFilters.value = null
        }
        loadPlanningData()
      },
      { deep: true }
    )

    // Surveiller les changements de période
    watch(selectedPeriod, () => {
      loadAllData()
    })

    // Surveiller les changements de mois pour les primes
    watch(selectedPrimeMonth, () => {
      loadPrimesData()
    })

    // Calcul des statistiques agents
    const calculateAgentsStats = (agentsList) => {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      const nouveauxAgents = agentsList.filter(agent => {
        const agentDate = new Date(agent.created_at)
        return agentDate.getMonth() === currentMonth && agentDate.getFullYear() === currentYear
      }).length

      const parRole = {}
      agentsList.forEach(agent => {
        const role = agent.role || 'Non spécifié'
        parRole[role] = (parRole[role] || 0) + 1
      })

      const rolesActifs = Object.keys(parRole).length

      const agentsComplets = agentsList.filter(agent =>
        agent.nom && agent.prenom && agent.matricule && agent.role && agent.mail
      ).length
      const tauxCompletion = agentsList.length > 0 ?
        Math.round((agentsComplets / agentsList.length) * 100) : 0

      agentsStats.value = {
        totalAgents: agentsList.length,
        nouveauxAgents,
        rolesActifs,
        tauxCompletion,
        parRole
      }
    }

    // Données temps réel
    const loadRealTimeData = async () => {
      try {
        const todayPresences = await presenceService.getPresencesAujourdhui()
        const presences = todayPresences.data?.data || []

        // Charger toutes les badgeuses
        recentCheckins.value = presences.map(presence => ({
          id: presence.id,
          agentName: `${presence.agent?.nom} ${presence.agent?.prenom}` || 'Agent inconnu',
          campaign: presence.agent?.campagne || 'Non spécifié',
          time: presence.heureEntree,
          type: 'in'
        }))

        alerts.value = generateAlerts(presences)

      } catch (error) {
        console.error('❌ Erreur données temps réel:', error)
        recentCheckins.value = []
        alerts.value = []
      }
    }

    // Génération des alertes
    const generateAlerts = (presences) => {
      const alerts = []

      // Alertes pour les sorties manquantes
      const pendingExits = presences.filter(p => p.heureEntree && !p.heureSortie)
      if (pendingExits.length > 5) {
        alerts.push({
          id: 1,
          title: 'Sorties en attente',
          message: `${pendingExits.length} agents n'ont pas pointé de sortie`,
          level: 'warning',
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        })
      }

      return alerts
    }

    // ============ MÉTHODES RAPPORT PRÉSENCE ============
    const genererRapportPresence = () => {
      showReportOptions.value = true
      selectedCampagneFilter.value = ''
      selectedReportPeriod.value = 'today'
    }

    const generatePresenceReportWithOptions = async () => {
      try {
        generatingReport.value = true

        console.log('📊 Début génération rapport de présence...')

        // Récupérer les données de présence selon la période sélectionnée
        let presenceData
        switch (selectedReportPeriod.value) {
          case 'today':
            presenceData = await presenceService.getPresencesAujourdhui()
            break
          case 'week':
            presenceData = await presenceService.getPresencesCetteSemaine()
            break
          case 'month':
            presenceData = await presenceService.getPresencesCeMois()
            break
          default:
            presenceData = await presenceService.getPresencesAujourdhui()
        }

        const presences = presenceData.data?.data || []

        // Appliquer le filtre par campagne si sélectionné
        let filteredPresences = presences
        if (selectedCampagneFilter.value) {
          filteredPresences = presences.filter(presence =>
            presence.agent?.campagne === selectedCampagneFilter.value
          )
        }

        if (filteredPresences.length === 0) {
          throw new Error('Aucune donnée de présence trouvée avec les critères sélectionnés')
        }

        // Générer le rapport selon le format choisi
        let blob
        let filename

        switch (selectedReportFormat.value) {
          case 'pdf':
            blob = await generatePresencePdfReport(filteredPresences, reportOptions.value)
            filename = `rapport_presence_${selectedReportPeriod.value}_${new Date().toISOString().split('T')[0]}.pdf`
            break
          case 'csv':
            blob = await generatePresenceCsvReport(filteredPresences, reportOptions.value)
            filename = `rapport_presence_${selectedReportPeriod.value}_${new Date().toISOString().split('T')[0]}.csv`
            break
          default:
            throw new Error('Format non supporté')
        }

        // Télécharger le fichier
        downloadFile(blob, filename)
        showReportOptions.value = false

        setTimeout(() => {
          alert(`✅ Rapport de présence généré avec succès!\nFichier: ${filename}\nPrésences: ${filteredPresences.length}`)
        }, 500)

      } catch (error) {
        console.error('❌ Erreur génération rapport présence:', error)
        alert('❌ Erreur lors de la génération du rapport de présence:\n' + error.message)
      } finally {
        generatingReport.value = false
      }
    }

    const generatePresenceCsvReport = async (presences, options) => {
      try {
        // En-têtes CSV pour la présence
        const headers = ['Agent', 'Campagne', 'Heure Entrée', 'Heure Sortie', 'Heures Travaillées', 'Date']

        const headerRow = headers.join(';')

        // === CALCUL DU TOTAL DES HEURES TRAVAILLÉES ===
        let totalHeuresTravaillees = 0
        let presencesAvecHeures = 0

        const dataRows = presences.map(presence => {
          let heuresTravaillees = presence.heuresTravaillées

          // Si pas d'heures travaillées mais on a les heures d'entrée/sortie, les calculer
          if ((!heuresTravaillees || heuresTravaillees === 'N/A') && presence.heureEntree && presence.heureSortie) {
            heuresTravaillees = calculerHeuresTravaillées(presence.heureEntree, presence.heureSortie)
          }

          // Calculer le total pour les statistiques
          if (heuresTravaillees && heuresTravaillees !== 'N/A') {
            const heuresDecimales = convertirHeuresEnDecimal(heuresTravaillees)
            totalHeuresTravaillees += heuresDecimales
            presencesAvecHeures++
          }

          const row = [
            `"${presence.agent?.nom || ''} ${presence.agent?.prenom || ''}"`,
            `"${presence.agent?.campagne || ''}"`,
            `"${presence.heureEntree || ''}"`,
            `"${presence.heureSortie || ''}"`,
            `"${heuresTravaillees || 'N/A'}"`,
            `"${new Date(presence.date || Date.now()).toLocaleDateString('fr-FR')}"`
          ]
          return row.join(';')
        })

        let csvContent = [headerRow, ...dataRows].join('\n')

        // === AJOUTER LES TOTAUX DANS LE CSV ===
        if (presences.length > 0) {
          const moyenneHeures = presencesAvecHeures > 0 ? (totalHeuresTravaillees / presencesAvecHeures).toFixed(2) : 0

          csvContent += '\n\n'
          csvContent += `"TOTAUX";"";"";"";"${totalHeuresTravaillees.toFixed(2)}h (moyenne: ${moyenneHeures}h)";"${presences.length} présences"`
        }

        if (options.includeStats) {
          csvContent += '\n\n'
          csvContent += `"STATISTIQUES DE PRÉSENCE";"";"";"";""\n`
          csvContent += `"Total présences";"${presences.length}";"";"";""\n`
          csvContent += `"Heures totales travaillées";"${totalHeuresTravaillees.toFixed(2)}h";"";"";""\n`
          csvContent += `"Moyenne heures/agent";"${moyenneHeures}h";"";"";""\n`
          csvContent += `"Agents avec heures calculées";"${presencesAvecHeures}";"";"";""\n`
        }

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

      } catch (error) {
        console.error('❌ Erreur génération CSV présence:', error)
        throw new Error(`Erreur lors de la génération du CSV de présence: ${error.message}`)
      }
    }

    // === MÉTHODE POUR CALCULER LES HEURES TRAVAILLÉES ===
    const calculerHeuresTravaillées = (heureEntree, heureSortie) => {
      if (!heureEntree || !heureSortie) return 'N/A'

      try {
        const entree = new Date(`2000-01-01T${heureEntree}`)
        const sortie = new Date(`2000-01-01T${heureSortie}`)

        // Si l'heure de sortie est avant l'heure d'entrée, ajouter un jour
        if (sortie < entree) {
          sortie.setDate(sortie.getDate() + 1)
        }

        const diffMs = sortie - entree
        const diffHeures = diffMs / (1000 * 60 * 60)

        // Formater en "8h30" ou "8.5"
        const heures = Math.floor(diffHeures)
        const minutes = Math.round((diffHeures - heures) * 60)

        if (minutes === 0) {
          return `${heures}h`
        } else {
          return `${heures}h${minutes.toString().padStart(2, '0')}`
        }
      } catch (error) {
        console.warn('❌ Erreur calcul heures travaillées:', error)
        return 'N/A'
      }
    }

    // === FONCTION POUR CONVERTIR LES HEURES EN DÉCIMAL ===
    const convertirHeuresEnDecimal = (heureString) => {
      if (!heureString || heureString === 'N/A' || heureString === '') return 0

      try {
        // Si c'est déjà un nombre, le retourner
        if (!isNaN(heureString)) return parseFloat(heureString)

        // Convertir en string et nettoyer
        const cleaned = heureString.toString().trim().toLowerCase()

        // Remplacer les virgules par des points pour les décimales françaises
        const normalized = cleaned.replace(',', '.')

        // Essayer de parser comme nombre décimal après normalisation
        if (!isNaN(normalized)) return parseFloat(normalized)

        // Expressions régulières pour différents formats d'heure
        const formats = [
          // Format "8h30" ou "8h"
          /^(\d+(?:[.,]\d+)?)h(?:\s*(\d+(?:[.,]\d+)?))?$/,
          // Format "8:30" ou "8:00"
          /^(\d+(?:[.,]\d+)?):(\d+(?:[.,]\d+)?)$/,
          // Format "8.5" (heures décimales)
          /^(\d+(?:[.,]\d+)?)$/
        ]

        for (const format of formats) {
          const match = cleaned.match(format)
          if (match) {
            let heures = parseFloat(match[1].replace(',', '.')) || 0
            let minutes = 0

            if (match[2] !== undefined) {
              minutes = parseFloat(match[2].replace(',', '.')) || 0
            }

            return heures + (minutes / 60)
          }
        }

        console.warn('⚠️ Format d\'heure non reconnu:', heureString)
        return 0

      } catch (error) {
        console.warn('❌ Erreur conversion heure:', heureString, error)
        return 0
      }
    }

    // === MÉTHODE POUR GÉNÉRER LE PDF DE PRÉSENCE ===
    const generatePresencePdfReport = async (presences, options) => {
      try {
        const doc = new jsPDF()

        // En-tête
        doc.setFontSize(20)
        doc.setTextColor(40, 40, 40)
        doc.text('RAPPORT DE PRÉSENCE', 105, 20, { align: 'center' })

        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text('Colarys Concept - Système de Gestion des Présences', 105, 30, { align: 'center' })

        // === CALCUL DU TOTAL DES HEURES TRAVAILLÉES ===
        let totalHeuresTravaillees = 0
        let presencesAvecHeures = 0

        // Préparer les données avec calcul des heures si nécessaire
        const donneesAvecHeures = presences.map(presence => {
          let heuresTravaillees = presence.heuresTravaillées

          // Si pas d'heures travaillées mais on a les heures d'entrée/sortie, les calculer
          if ((!heuresTravaillees || heuresTravaillees === 'N/A') && presence.heureEntree && presence.heureSortie) {
            heuresTravaillees = calculerHeuresTravaillées(presence.heureEntree, presence.heureSortie)
          }

          // Calculer le total pour les statistiques
          if (heuresTravaillees && heuresTravaillees !== 'N/A') {
            const heuresDecimales = convertirHeuresEnDecimal(heuresTravaillees)
            totalHeuresTravaillees += heuresDecimales
            presencesAvecHeures++
          }

          return {
            ...presence,
            heuresTravailleesCalculees: heuresTravaillees
          }
        })

        const moyenneHeures = presencesAvecHeures > 0 ? (totalHeuresTravaillees / presencesAvecHeures).toFixed(2) : 0

        // Informations
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text(`Période: ${selectedReportPeriod.value}`, 20, 45)
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 20, 52)
        doc.text(`Total présences: ${presences.length}`, 150, 45)

        if (selectedCampagneFilter.value) {
          doc.text(`Filtre campagne: ${selectedCampagneFilter.value}`, 150, 52)
        }

        // Tableau des présences
        const headers = ['AGENT', 'CAMPAGNE', 'HEURE ENTREE', 'HEURE SORTIE', 'HEURES', 'DATE']

        const data = donneesAvecHeures.map(presence => [
          `${presence.agent?.nom || ''} ${presence.agent?.prenom || ''}`,
          presence.agent?.campagne || '',
          presence.heureEntree || '',
          presence.heureSortie || '',
          presence.heuresTravailleesCalculees || 'N/A',
          new Date(presence.date || Date.now()).toLocaleDateString('fr-FR')
        ])

        // === AJOUTER LA LIGNE DE TOTAL ===
        if (presences.length > 0) {
          // Ajouter une ligne vide pour la séparation
          data.push(['', '', '', '', '', ''])

          // Ajouter la ligne de total
          data.push([
            'TOTAL',
            '',
            '',
            '',
            `${totalHeuresTravaillees.toFixed(2)}h (moy: ${moyenneHeures}h)`,
            `${presences.length} présences`
          ])
        }

        // Générer le tableau
        autoTable(doc, {
          startY: 60,
          head: [headers],
          body: data,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [40, 40, 40]
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          // Style pour la dernière ligne (total)
          didParseCell: function (data) {
            if (data.section === 'body' && data.row.index === data.table.body.length - 1) {
              data.cell.styles.fillColor = [41, 128, 185]
              data.cell.styles.textColor = [255, 255, 255]
              data.cell.styles.fontStyle = 'bold'
              data.cell.styles.fontSize = 9
            }
          }
        })

        // Statistiques
        if (options.includeStats) {
          const finalY = doc.lastAutoTable.finalY + 10
          let statsY = finalY + 10

          doc.setFontSize(12)
          doc.setTextColor(41, 128, 185)
          doc.text('STATISTIQUES DE PRÉSENCE', 20, statsY)
          statsY += 8

          doc.setFontSize(9)
          doc.setTextColor(80, 80, 80)

          doc.text(`Total présences: ${presences.length}`, 25, statsY)
          statsY += 6
          doc.text(`Heures totales travaillées: ${totalHeuresTravaillees.toFixed(2)}h`, 25, statsY)
          statsY += 6
          doc.text(`Moyenne heures/agent: ${moyenneHeures}h`, 25, statsY)
          statsY += 6
          doc.text(`Agents avec heures calculées: ${presencesAvecHeures}`, 25, statsY)
        }

        // Pied de page
        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('Document généré automatiquement par le système Colarys Concept', 105, pageHeight - 10, { align: 'center' })

        return doc.output('blob')

      } catch (error) {
        console.error('❌ Erreur génération PDF présence:', error)
        // Fallback vers CSV
        return await generatePresenceCsvReport(presences, options)
      }
    }

    const closeReportOptions = () => {
      showReportOptions.value = false
    }

    // ============ MÉTHODES RAPPORT AGENTS ============
    const genererRapportAgents = () => {
      showAgentReportOptions.value = true
    }

    // Fonction de téléchargement
    const downloadFile = (blob, filename) => {
      try {
        if (!blob || !(blob instanceof Blob)) {
          console.error('❌ Objet blob invalide:', blob)
          throw new Error('Le fichier à télécharger est invalide')
        }

        if (blob.size === 0 && !filename.endsWith('.pdf')) {
          console.error('❌ Blob vide')
          throw new Error('Le fichier à télécharger est vide')
        }

        console.log('📦 Préparation du téléchargement:', {
          filename,
          type: blob.type,
          size: blob.size
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.style.display = 'none'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => {
          window.URL.revokeObjectURL(url)
          console.log('✅ URL libérée pour:', filename)
        }, 1000)

        console.log('✅ Fichier téléchargé avec succès:', filename)

      } catch (error) {
        console.error('❌ Erreur téléchargement fichier:', error)
        throw new Error(`Impossible de télécharger le fichier: ${error.message}`)
      }
    }

    // Génération CSV agents
    const generateCsvReport = async (agents, options) => {
      try {
        console.log('📋 Génération CSV pour', agents.length, 'agents')

        // En-têtes CSV
        const headers = ['Matricule', 'Nom', 'Prénom', 'Rôle', 'Email', 'Contact', 'Entreprise', 'Date Création']

        // Ligne d'en-tête
        const headerRow = headers.join(';')

        // Données CSV
        const dataRows = agents.map(agent => {
          const row = [
            agent.matricule || 'N/A',
            `"${(agent.nom || '').replace(/"/g, '""')}"`,
            `"${(agent.prenom || '').replace(/"/g, '""')}"`,
            `"${(agent.role || '').replace(/"/g, '""')}"`,
            `"${(agent.mail || '').replace(/"/g, '""')}"`,
            `"${(agent.contact || '').replace(/"/g, '""')}"`,
            `"${(agent.entreprise || '').replace(/"/g, '""')}"`,
            `"${new Date(agent.created_at).toLocaleDateString('fr-FR')}"`
          ]
          return row.join(';')
        })

        let csvContent = [headerRow, ...dataRows].join('\n')

        if (options.includeStats) {
          // Ajouter les statistiques
          csvContent += '\n\n'
          csvContent += `"STATISTIQUES GLOBALES";"";"";"";""\n`
          csvContent += `"Total des agents";"${agentsStats.value.totalAgents}";"";"";""\n`
          csvContent += `"Nouveaux agents ce mois";"${agentsStats.value.nouveauxAgents}";"";"";""\n`
          csvContent += `"Rôles actifs";"${agentsStats.value.rolesActifs}";"";"";""\n`
          csvContent += `"Taux de completion";"${agentsStats.value.tauxCompletion}%";"";"";""\n`

          // Statistiques par rôle
          csvContent += `"RÉPARTITION PAR RÔLE";"";"";"";""\n`
          Object.entries(agentsStats.value.parRole).forEach(([role, count]) => {
            const percentage = getRolePercentage(count)
            csvContent += `"${role}";"${count} agents (${percentage}%)";"";"";""\n`
          })
        }

        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;'
        })

        console.log('✅ CSV généré - Taille:', blob.size, 'type:', blob.type)
        return blob

      } catch (error) {
        console.error('❌ Erreur génération CSV:', error)
        throw new Error(`Erreur lors de la génération du CSV: ${error.message}`)
      }
    }

    // Génération PDF agents
    const generateRealPdfReport = async (agents, options) => {
      try {
        console.log('📄 Début génération PDF pour', agents.length, 'agents')

        const doc = new jsPDF()

        // === EN-TÊTE DU DOCUMENT ===
        doc.setFontSize(20)
        doc.setTextColor(40, 40, 40)
        doc.text('RAPPORT DES AGENTS COLARYS', 105, 20, { align: 'center' })

        // Sous-titre
        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text('Colarys Concept - Système de Gestion', 105, 30, { align: 'center' })

        // Ligne de séparation
        doc.setDrawColor(200, 200, 200)
        doc.line(20, 35, 190, 35)

        // === INFORMATIONS DU RAPPORT ===
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)

        const dateGeneration = new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        doc.text(`Date de génération: ${dateGeneration}`, 20, 45)
        doc.text(`Heure: ${new Date().toLocaleTimeString('fr-FR')}`, 20, 52)
        doc.text(`Total agents: ${agents.length}`, 150, 45)

        if (selectedRoleFilter.value) {
          doc.text(`Filtre rôle: ${selectedRoleFilter.value}`, 150, 52)
        }

        // === PRÉPARATION DES DONNÉES DU TABLEAU ===
        const headers = [
          'MATRICULE',
          'NOM',
          'PRÉNOM',
          'RÔLE',
          'EMAIL',
          'CONTACT',
          'ENTREPRISE',
          'DATE CRÉATION'
        ]

        const data = agents.map(agent => [
          agent.matricule || 'N/A',
          agent.nom || '',
          agent.prenom || '',
          agent.role || '',
          agent.mail || '',
          agent.contact || '',
          agent.entreprise || '',
          new Date(agent.created_at).toLocaleDateString('fr-FR')
        ])

        // === GÉNÉRATION DU TABLEAU ===
        autoTable(doc, {
          startY: 60,
          head: [headers],
          body: data,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [40, 40, 40]
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { top: 60 }
        })

        // === STATISTIQUES SI DEMANDÉES ===
        if (options.includeStats) {
          const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200
          let statsY = finalY + 10

          // Titre des statistiques
          doc.setFontSize(12)
          doc.setTextColor(41, 128, 185)
          doc.text('STATISTIQUES GLOBALES', 20, statsY)
          statsY += 8

          // Statistiques principales
          doc.setFontSize(9)
          doc.setTextColor(80, 80, 80)

          doc.text(`Total des agents: ${agentsStats.value.totalAgents}`, 25, statsY)
          statsY += 6
          doc.text(`Nouveaux agents ce mois: ${agentsStats.value.nouveauxAgents}`, 25, statsY)
          statsY += 6
          doc.text(`Rôles actifs: ${agentsStats.value.rolesActifs}`, 25, statsY)
          statsY += 6
          doc.text(`Taux de completion: ${agentsStats.value.tauxCompletion}%`, 25, statsY)
          statsY += 10

          // Statistiques par rôle
          doc.setFontSize(10)
          doc.setTextColor(41, 128, 185)
          doc.text('RÉPARTITION PAR RÔLE', 20, statsY)
          statsY += 8

          doc.setFontSize(9)
          doc.setTextColor(80, 80, 80)

          Object.entries(agentsStats.value.parRole).forEach(([role, count]) => {
            const percentage = getRolePercentage(count)
            doc.text(`${role}: ${count} agents (${percentage}%)`, 25, statsY)
            statsY += 6
          })
        }

        // Pied de page final
        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('Document généré automatiquement par le système Colarys Concept', 105, pageHeight - 10, { align: 'center' })
        doc.text(`© ${new Date().getFullYear()} Colarys Concept - Tous droits réservés`, 105, pageHeight - 5, { align: 'center' })

        console.log('✅ PDF généré avec succès')
        return doc.output('blob')

      } catch (error) {
        console.error('❌ Erreur génération PDF:', error)
        // Fallback vers CSV en cas d'erreur
        return await generateCsvReport(agents, options)
      }
    }

    const generateAgentReportWithOptions = async () => {
      try {
        generatingAgentReport.value = true

        console.log('📊 Début génération rapport agents...')

        let agents = await agentService.getAllAgents()

        console.log(`📋 ${agents.length} agents trouvés`)

        // Appliquer le filtre par rôle si sélectionné
        if (selectedRoleFilter.value) {
          agents = agents.filter(agent =>
            agent.role === selectedRoleFilter.value
          )
          console.log(`🔍 Filtre appliqué: ${selectedRoleFilter.value} -> ${agents.length} agents`)
        }

        if (agents.length === 0) {
          throw new Error('Aucun agent trouvé avec les critères sélectionnés')
        }

        // Générer le rapport selon le format choisi
        let blob
        let filename

        switch (selectedAgentReportFormat.value) {
          case 'pdf':
            console.log('📄 Génération PDF agents en cours...')
            blob = await generateRealPdfReport(agents, agentReportOptions.value)
            filename = `rapport_agents_${new Date().toISOString().split('T')[0]}.pdf`
            break

          case 'csv':
            blob = await generateCsvReport(agents, agentReportOptions.value)
            filename = `rapport_agents_${new Date().toISOString().split('T')[0]}.csv`
            break

          default:
            throw new Error('Format non supporté')
        }

        console.log('✅ Rapport agents généré, début téléchargement...', {
          filename,
          type: blob.type,
          size: blob.size
        })

        // Télécharger le fichier
        downloadFile(blob, filename)

        showAgentReportOptions.value = false

        // Message de succès
        setTimeout(() => {
          let message = `✅ Rapport agents généré avec succès!\nFichier: ${filename}\nAgents: ${agents.length}`

          if (selectedAgentReportFormat.value === 'pdf') {
            message += '\n\n📄 Format: PDF professionnel avec mise en page'
          } else {
            message += '\n\n📊 Format: CSV compatible avec Excel'
          }

          alert(message)
        }, 500)

      } catch (error) {
        console.error('❌ Erreur génération rapport agents:', error)
        alert('❌ Erreur lors de la génération du rapport agents:\n' + error.message)
      } finally {
        generatingAgentReport.value = false
      }
    }

    const closeAgentReportOptions = () => {
      showAgentReportOptions.value = false
    }

    // Navigation
    const ouvrirGestionPresence = () => {
      router.push('/presence')
    }

    const ouvrirGestionPlanning = () => {
      router.push('/planning')
    }

    const ouvrirStatistiquesPlanning = () => {
      router.push('/planning')
    }

    const ouvrirGestionAgents = () => {
      router.push('/agents')
    }

    const ouvrirHistoriquePresence = () => {
      router.push('/historique-presence')
    }

    // ============ MÉTHODES RAPPORT PLANNING ============
    const genererRapportPlanning = () => {
      showPlanningReportOptions.value = true
    }

    const generatePlanningReportWithOptions = async () => {
      try {
        generatingPlanningReport.value = true

        console.log('📊 Génération rapport planning avec période:', selectedPlanningPeriod.value)

        let finalData = []

        // Charger les données selon la période sélectionnée
        switch (selectedPlanningPeriod.value) {
          case 'current':
            const currentWeek = getCurrentWeek()
            console.log(`🔍 Chargement semaine actuelle: ${currentWeek}`)
            finalData = await PlanningService.getPlannings({ selectedWeek: currentWeek })
            break
          case 'last':
            const lastWeek = getLastWeek()
            console.log(`🔍 Chargement semaine précédente: ${lastWeek}`)
            finalData = await PlanningService.getPlannings({ selectedWeek: lastWeek })
            break
          case 'month':
            const currentMonth = new Date().getMonth() + 1
            const currentYear = new Date().getFullYear()
            console.log(`🔍 Chargement mois actuel: ${currentMonth}/${currentYear}`)
            finalData = await PlanningService.getPlannings({
              selectedYear: currentYear.toString(),
              selectedMonth: currentMonth.toString()
            })
            break
          case 'all':
            console.log('🔍 Chargement de toutes les données planning')
            finalData = await PlanningService.getPlannings({})
            break
          default:
            console.log('🔍 Chargement données avec filtres actuels')
            finalData = planningData.value.length > 0 ? planningData.value : await PlanningService.getPlannings({})
        }

        console.log('📋 Données planning chargées:', finalData.length)

        // Si pas de données, essayer de charger sans filtres
        if (finalData.length === 0) {
          console.log('🔄 Aucune donnée avec les filtres actuels, tentative sans filtres...')
          finalData = await PlanningService.getPlannings({})
          console.log('📋 Données sans filtres:', finalData.length)
        }

        if (finalData.length === 0) {
          throw new Error('Aucune donnée de planning disponible dans le système.')
        }

        // Générer le rapport
        let blob
        let filename

        switch (selectedPlanningReportFormat.value) {
          case 'pdf':
            blob = await generatePlanningPdfReport(finalData, planningReportOptions.value)
            filename = `rapport_planning_${selectedPlanningPeriod.value}_${new Date().toISOString().split('T')[0]}.pdf`
            break
          case 'csv':
            blob = await generatePlanningCsvReport(finalData, planningReportOptions.value)
            filename = `rapport_planning_${selectedPlanningPeriod.value}_${new Date().toISOString().split('T')[0]}.csv`
            break
          case 'excel':
            blob = await generatePlanningExcelReport(finalData, planningReportOptions.value)
            filename = `rapport_planning_${selectedPlanningPeriod.value}_${new Date().toISOString().split('T')[0]}.xlsx`
            break
          default:
            throw new Error('Format non supporté')
        }

        // Télécharger le fichier
        downloadFile(blob, filename)
        showPlanningReportOptions.value = false

        setTimeout(() => {
          let message = `✅ Rapport planning généré avec succès!\nFichier: ${filename}\nAgents uniques: ${uniqueAgentsCount.value}`

          if (activePlanningFilters.value) {
            message += `\n\n📋 Données filtrées selon les critères de la page Planning`
          }

          alert(message)
        }, 500)

      } catch (error) {
        console.error('❌ Erreur génération rapport planning:', error)

        let errorMessage = 'Erreur lors de la génération du rapport planning:\n'

        if (error.message.includes('Aucune donnée')) {
          errorMessage += 'Aucune donnée de planning disponible.\n\n'
          errorMessage += 'Veuillez vérifier que:\n'
          errorMessage += '• Des plannings ont été créés\n'
          errorMessage += '• Les filtres appliqués sont corrects\n'
          errorMessage += '• Le service planning est accessible'
        } else {
          errorMessage += error.message
        }

        alert(errorMessage)
      } finally {
        generatingPlanningReport.value = false
      }
    }

    const generatePlanningCsvReport = async (plannings, options) => {
      try {
        const headers = ['Agent', 'Semaine', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche', 'Total Heures', 'Remarques']

        const headerRow = headers.join(';')

        const dataRows = plannings.map(planning => {
          const row = [
            `"${planning.agent_name}"`,
            `"${planning.semaine}"`,
            `"${planning.lundi || 'OFF'}"`,
            `"${planning.mardi || 'OFF'}"`,
            `"${planning.mercredi || 'OFF'}"`,
            `"${planning.jeudi || 'OFF'}"`,
            `"${planning.vendredi || 'OFF'}"`,
            `"${planning.samedi || 'OFF'}"`,
            `"${planning.dimanche || 'OFF'}"`,
            `"${planning.total_heures}"`,
            `"${planning.remarques || ''}"`
          ]
          return row.join(';')
        })

        let csvContent = [headerRow, ...dataRows].join('\n')

        if (options.includeStats) {
          const totalHours = plannings.reduce((sum, p) => sum + p.total_heures, 0)
          const avgHours = plannings.length > 0 ? totalHours / plannings.length : 0

          csvContent += '\n\n'
          csvContent += `"STATISTIQUES PLANNING";"";"";"";""\n`
          csvContent += `"Agents uniques";"${uniqueAgentsCount.value}";"";"";""\n`
          csvContent += `"Heures totales programmées";"${totalHours}h";"";"";""\n`
          csvContent += `"Moyenne heures/agent";"${avgHours.toFixed(1)}h";"";"";""\n`
        }

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

      } catch (error) {
        console.error('❌ Erreur génération CSV planning:', error)
        throw new Error(`Erreur lors de la génération du CSV planning: ${error.message}`)
      }
    }

    const generatePlanningPdfReport = async (plannings, options) => {
      try {
        const doc = new jsPDF()

        // En-tête
        doc.setFontSize(20)
        doc.setTextColor(40, 40, 40)
        doc.text('RAPPORT DE PLANNING', 105, 20, { align: 'center' })

        doc.setFontSize(12)
        doc.setTextColor(100, 100, 100)
        doc.text('Colarys Concept - Système de Gestion des Plannings', 105, 30, { align: 'center' })

        // Informations
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        doc.text(`Période: ${selectedPlanningPeriod.value}`, 20, 45)
        doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, 20, 52)
        doc.text(`Agents uniques: ${uniqueAgentsCount.value}`, 150, 45)

        // Tableau des plannings
        const headers = ['AGENT', 'SEMAINE', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM', 'HEURES', 'REMARQUES']

        const data = plannings.map(planning => [
          planning.agent_name,
          planning.semaine,
          planning.lundi || 'OFF',
          planning.mardi || 'OFF',
          planning.mercredi || 'OFF',
          planning.jeudi || 'OFF',
          planning.vendredi || 'OFF',
          planning.samedi || 'OFF',
          planning.dimanche || 'OFF',
          planning.total_heures.toString(),
          planning.remarques || ''
        ])

        // Générer le tableau
        autoTable(doc, {
          startY: 60,
          head: [headers],
          body: data,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [40, 40, 40]
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          }
        })

        // Statistiques
        if (options.includeStats) {
          const finalY = doc.lastAutoTable.finalY + 10
          let statsY = finalY + 10

          const totalHours = plannings.reduce((sum, p) => sum + p.total_heures, 0)
          const avgHours = plannings.length > 0 ? totalHours / plannings.length : 0

          doc.setFontSize(12)
          doc.setTextColor(41, 128, 185)
          doc.text('STATISTIQUES PLANNING', 20, statsY)
          statsY += 8

          doc.setFontSize(9)
          doc.setTextColor(80, 80, 80)

          doc.text(`Agents uniques: ${uniqueAgentsCount.value}`, 25, statsY)
          statsY += 6
          doc.text(`Heures totales programmées: ${totalHours}h`, 25, statsY)
          statsY += 6
          doc.text(`Moyenne heures/agent: ${avgHours.toFixed(1)}h`, 25, statsY)
        }

        // Pied de page
        const pageHeight = doc.internal.pageSize.height
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('Document généré automatiquement par le système Colarys Concept', 105, pageHeight - 10, { align: 'center' })

        return doc.output('blob')

      } catch (error) {
        console.error('❌ Erreur génération PDF planning:', error)
        return await generatePlanningCsvReport(plannings, options)
      }
    }

    const generatePlanningExcelReport = async (plannings, options) => {
      try {
        const XLSX = await import('xlsx')

        const data = plannings.map(planning => ({
          'Agent': planning.agent_name,
          'Semaine': planning.semaine,
          'Lundi': planning.lundi || 'OFF',
          'Mardi': planning.mardi || 'OFF',
          'Mercredi': planning.mercredi || 'OFF',
          'Jeudi': planning.jeudi || 'OFF',
          'Vendredi': planning.vendredi || 'OFF',
          'Samedi': planning.samedi || 'OFF',
          'Dimanche': planning.dimanche || 'OFF',
          'Total Heures': planning.total_heures,
          'Remarques': planning.remarques || ''
        }))

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Planning')

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      } catch (error) {
        console.error('❌ Erreur génération Excel planning:', error)
        throw new Error(`Erreur lors de la génération du Excel planning: ${error.message}`)
      }
    }

    const closePlanningReportOptions = () => {
      showPlanningReportOptions.value = false
    }

    const getCurrentWeek = () => {
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
      const weekNumber = Math.ceil((days + 1) / 7)
      return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
    }

    const getLastWeek = () => {
      const now = new Date()
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const startOfYear = new Date(lastWeek.getFullYear(), 0, 1)
      const days = Math.floor((lastWeek - startOfYear) / (24 * 60 * 60 * 1000))
      const weekNumber = Math.ceil((days + 1) / 7)
      return `${lastWeek.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
    }

    // Données par défaut
    const setDefaultData = () => {
      presenceStats.value = {
        presentsAujourdhui: 0,
        enAttenteSortie: 0,
        heuresTravaillees: 0,
        totalPointages: 0,
        entreesAujourdhui: 0,
        sortiesAujourdhui: 0,
        moyenneHeures: 0,
        tauxPresence: 0,
        parCampagne: {}
      }
      agentsStats.value = { totalAgents: 0, nouveauxAgents: 0, rolesActifs: 0, tauxCompletion: 0, parRole: {} }
      // Ne pas réinitialiser les données de planning si elles sont déjà chargées
      if (!planningDataLoaded.value) {
        planningStats.value = { agentsProgrammes: 0, congesSemaine: 0, heuresMoyennes: 0, couvertures: 0, trendPlanning: 0 }
      }
    }

    // Initialisation
    let refreshInterval

    onMounted(() => {
      updateTime()
      loadAllData()

      // Mise à jour de l'heure
      setInterval(updateTime, 1000)

      // CORRECTION : Auto-refresh des données sauf pour le planning (garder les données persistantes)
      refreshInterval = setInterval(() => {
        if (autoRefresh.value) {
          loadPresenceData()
          loadRealTimeData()
          // Ne pas recharger automatiquement les données de planning pour éviter la perte
          console.log('🔄 Auto-refresh: Présence et données temps réel seulement')
        }
      }, 30000)
    })

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    })

    return {
      // États
      loading,
      autoRefresh,
      selectedPeriod,

      // ============ CORRECTION : Ajout des variables planning ============
      planningData,
      planningDataLoaded,
      activePlanningFilters,
      activePlanningFiltersText,
      clearPlanningFilters,
      currentPlanningPeriod,
      uniqueAgentsCount,

      // Rapports présence
      showReportOptions,
      selectedReportFormat,
      selectedCampagneFilter,
      selectedReportPeriod,
      generatingReport,
      reportOptions,

      // Rapports agents
      showAgentReportOptions,
      selectedAgentReportFormat,
      selectedRoleFilter,
      generatingAgentReport,
      agentReportOptions,

      // Rapports planning
      showPlanningReportOptions,
      selectedPlanningReportFormat,
      selectedPlanningPeriod,
      generatingPlanningReport,
      planningReportOptions,

      // NOUVEAUX RETOURS POUR LES PRIMES
      selectedPrimeMonth,
      primeAppPrix,
      primeTmcPrix,
      primesStats,
      primesSummary,
      selectedPrimeAgent,
      primeAgentDetails,
      formattedPrimeMonth,

      // États pour l'affichage
      agentsList,
      displayedAgents,
      maxDisplayedAgents,
      showAllAgents,

      displayedCheckins,
      showAllCheckins,
      maxDisplayedCheckins,

      getAgentStatus,
      getAgentStatusText,
      handleImageError,
      getAgentImageUrl,

      // Données
      currentTime,
      currentDate,
      lastUpdate,
      isOnline,
      agentsStats,
      presenceStats,
      planningStats,
      recentCheckins,
      alerts,
      totalAgentsToday,

      // Méthodes
      getRolePercentage,
      getTrendClass,
      getTrendIcon,
      getAlertIcon,
      getCampaignPercentage,
      getInitials,
      toggleAutoRefresh,
      ouvrirGestionAgents,
      ouvrirGestionPresence,
      ouvrirGestionPlanning,
      ouvrirHistoriquePresence,
      genererRapportAgents,
      genererRapportPresence,
      generatePresenceReportWithOptions,
      generateAgentReportWithOptions,
      closeReportOptions,
      closeAgentReportOptions,
      loadPlanningData,

      // Fonctions planning
      ouvrirStatistiquesPlanning,
      genererRapportPlanning,
      generatePlanningReportWithOptions,
      closePlanningReportOptions,
      getShiftPercentage,
      getShiftTypePercentage,
      getShiftBadgeClass,
      formatShiftName,
      getPeriodTypeText,

      // Méthodes primes
      loadPrimesData,
      updatePrimesCalculations,
      showPrimeDetails,
      ouvrirGestionPrimes,
      exportPrimesExcel,
      exportPrimesPDF,
      formatAr
    }
  }
}
</script>

<style scoped>
/* Correction pour les boutons des primes */
.primes-quick-actions0 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.primes-quick-actions0 .quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
  border: none;
  color: white;
}

.primes-quick-actions0 .primary-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.primes-quick-actions0 .export-excel-btn {
  background: #28a745;
}

.primes-quick-actions0 .export-pdf-btn {
  background: #dc3545;
}

.primes-quick-actions0 .quick-action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  filter: brightness(1.1);
}

.primes-quick-actions0 .quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* États de hover spécifiques */
.primes-quick-actions0 .primary-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #3498db);
}

.primes-quick-actions0 .export-excel-btn:hover:not(:disabled) {
  background: #218838;
}

.primes-quick-actions0 .export-pdf-btn:hover:not(:disabled) {
  background: #c82333;
}

.planning-period-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.period-display {
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.period-info-card {
  padding: 20px;
  margin-bottom: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.period-info-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.period-item {
  display: flex;
  align-items: center;
  gap: 15px;

}

.period-item i {
  font-size: 1.5rem;
  color: #4cc9f0;
  width: 40px;
  text-align: center;
}

.period-details {
  flex: 1;
}

.period-label {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-bottom: 4px;
}

.period-value {
  font-size: 1.1rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .planning-period-info {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .period-info-content {
    grid-template-columns: 1fr;
  }

  .period-item {
    justify-content: flex-start;
  }
}


/* Application des couleurs spécifiées */
.dashboard {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
}

/* Section Bienvenue améliorée */
.welcome-section {
  padding: 40px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.welcome-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #fff 0%, #a8c6ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0 0 20px 0;
}

.indicators {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.indicator {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.indicator.online.active {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
}

.graphic-circle {
  width: 120px;
  height: 120px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: pulse 2s infinite;
  background: rgba(255, 255, 255, 0.1);
}

.inner-stats {
  text-align: center;
}

.stat-main {
  display: block;
  font-size: 2rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

/* Sections */
section {
  padding: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.section-title h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.last-update,
.auto-refresh {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  cursor: pointer;
}

.auto-refresh .refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* NOUVEAUX STYLES POUR LA SECTION PRIMES */
.section-primes {
  padding: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Grille des métriques primes */
.primes-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

/* Cartes spécifiques pour les primes */
.total-primes {
  border-left: 4px solid #27ae60;
}

.primes-appels {
  border-left: 4px solid #e74c3c;
}

.primes-tmc {
  border-left: 4px solid #3498db;
}

.primes-moyenne {
  border-left: 4px solid #f39c12;
}

/* Contrôles des primes */
.primes-controls {
  padding: 20px;
  margin-bottom: 25px;
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  align-items: end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 600;
  font-size: 0.9rem;
  opacity: 0.9;
}

.month-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 10px;
  color: white;
  font-size: 0.9rem;
  min-width: 200px;
}

.month-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
}

.prices-controls {
  display: flex;
  gap: 20px;
}

.price-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-control label {
  font-weight: 600;
  font-size: 0.9rem;
  opacity: 0.9;
}

.price-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 10px;
  color: white;
  font-size: 0.9rem;
  width: 120px;
}

.price-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
}

/* Résumé des primes */
.primes-summary {
  padding: 20px;
  margin-bottom: 25px;
}

.primes-summary h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: white;
}

.summary-table-container {
  max-height: 400px;
  overflow-y: auto;
}

/* Styles pour les tables des primes */
.primes-table,
.details-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.primes-table th {
  background: rgba(255, 255, 255, 0.05);
}

.primes-table td,
.details-table td {
  padding: 10px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.85rem;
}

.prime-row {
  transition: background 0.3s ease;
  cursor: pointer;
}

.prime-row:hover {
  background: rgba(255, 255, 255, 0.1);
}

.agent-name {
  font-weight: 600;
}

.numeric {
  text-align: right;
  font-family: 'Courier New', monospace;
}

.total-amount {
  font-weight: 600;
  color: #27ae60;
}

.primes-total {
  background: rgba(255, 255, 255, 0.1);
}

.primes-total td {
  font-weight: 600;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
}

/* État vide */
.no-primes-data {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.7;
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Détails des primes */
.prime-details {
  padding: 20px;
  margin-bottom: 25px;
}

.prime-details h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: white;
}

.details-table-container {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.details-table th {
  background: rgba(243, 156, 18, 0.3);
}

.details-table td {
  padding: 8px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.8rem;
}

.btn-close-details {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.btn-close-details:hover {
  background: rgba(220, 53, 69, 0.3);
  border-color: rgba(220, 53, 69, 0.5);
}

/* Actions rapides primes  */
.primes-quick-actions {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.primes-quick-actions .quick-action-btn1 {
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
}

.primes-quick-actions .quick-action-btn2 {
  align-items: center;
  background: #95a5a6;
  color: white;
  background: linear-gradient(135deg, #3498db, #2980b9);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
}

.primes-quick-actions .quick-action-btn3 {
  align-items: center;
  background: #95a5a6;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
}

.primes-quick-actions .quick-action-btn:hover:not(:disabled) {
  background: rgba(139, 69, 19, 0.4);
  border-color: rgba(139, 69, 19, 0.7);
}

.primes-quick-actions .quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 1024px) {
  .primes-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .primes-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .prices-controls {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .primes-metrics-grid {
    grid-template-columns: 1fr;
  }

  .primes-table {
    font-size: 0.8rem;
  }

  .primes-table th,
  .primes-table td {
    padding: 8px 4px;
  }

  .details-table {
    font-size: 0.75rem;
  }

  .details-table th,
  .details-table td {
    padding: 6px 4px;
  }

  .primes-quick-actions {
    flex-direction: column;
    align-items: center;
  }

  .primes-quick-actions .quick-action-btn {
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .prices-controls {
    flex-direction: column;
    gap: 10px;
  }

  .price-input {
    width: 100%;
  }

  .month-input {
    min-width: 150px;
  }
}

.dashboard {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
}

/* Section Bienvenue améliorée */
.welcome-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 40px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.welcome-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #fff 0%, #a8c6ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0 0 20px 0;
}

.indicators {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.indicator {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.indicator.online.active {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
}

.graphic-circle {
  width: 120px;
  height: 120px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: pulse 2s infinite;
  background: rgba(255, 255, 255, 0.1);
}

.inner-stats {
  text-align: center;
}

.stat-main {
  display: block;
  font-size: 2rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

/* Sections */
section {
  padding: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.section-title h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.last-update,
.auto-refresh {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  cursor: pointer;
}

.auto-refresh .refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.dashboard {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
}

/* Section Bienvenue améliorée */
.welcome-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 40px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.welcome-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #fff 0%, #a8c6ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0 0 20px 0;
}

.indicators {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.indicator {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.indicator.online.active {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
}

.graphic-circle {
  width: 120px;
  height: 120px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: pulse 2s infinite;
  background: rgba(255, 255, 255, 0.1);
}

.inner-stats {
  text-align: center;
}

.stat-main {
  display: block;
  font-size: 2rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

/* Sections */
section {
  padding: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 15px;
  border-radius: 8px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.section-title h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.last-update,
.auto-refresh {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  cursor: pointer;
}

.auto-refresh .refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}


.dashboard {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
}

/* Styles existants conservés et adaptés */
.welcome-section {
  padding: 40px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.welcome-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #fff 0%, #a8c6ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0 0 20px 0;
}

.indicators {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.indicator {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.indicator.online.active {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
}

.graphic-circle {
  width: 120px;
  height: 120px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: pulse 2s infinite;
  background: rgba(255, 255, 255, 0.1);
}


.inner-stats {
  text-align: center;
}

.stat-main {
  display: block;
  font-size: 2rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

/* Sections */
section {
  padding: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 15px;
  border-radius: 8px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.section-title h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.last-update,
.auto-refresh {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  cursor: pointer;
}

.auto-refresh .refreshing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}


.agent-secondary-info {
  font-size: 0.7rem;
  opacity: 0.6;
  display: flex;
  gap: 4px;
  align-items: center;
}

.agent-separator {
  opacity: 0.4;
}

/* Version alternative avec grille pour un alignement parfait */
.section-realtime .agents-quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 100px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-realtime .quick-action-btn1 {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
}


.section-realtime .quick-action-btn2 {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #95a5a6;
  color: white;
  background: linear-gradient(135deg, #3498db, #2980b9);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;

}


.section-realtime .quick-action-btn3 {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #95a5a6;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
}

.section-realtime .quick-action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.section-realtime .quick-action-btn i {
  font-size: 1.2rem;
  opacity: 0.9;
}

/* Responsive pour la version grille */
@media (max-width: 1024px) {
  .section-realtime .agents-quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .section-realtime .agents-quick-actions {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .section-realtime .quick-action-btn {
    min-height: 55px;
    padding: 12px 15px;
  }
}

.agent-matricule {
  font-size: 0.75rem;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #a8c6ff;
  /* Couleur bleue claire pour le distinguer */
}

/* SECTION PRÉSENCES - NOUVELLE GRILLE */
.metric-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.2);
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 8px;
}

.metric-trend {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #4caf50;
}

.metric-subtext {
  font-size: 0.8rem;
  opacity: 0.7;
}

/* Répartition par campagne */
.campaign-breakdown {
  padding: 20px;
  margin-top: 20px;
}

.campaign-breakdown h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.campaign-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.campaign-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 0;
}

.campaign-name {
  min-width: 120px;
  font-weight: 600;
}

.campaign-count {
  min-width: 30px;
  text-align: right;
  font-weight: 600;
}

/* Grille temps réel */
.realtime-grid {
  grid-template-columns: 1fr 1fr;
  border-radius: 8px;
}

.realtime-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.badge {
  background: #4361ee;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.alert {
  background: #f44336;
}

/* Texte important en #ffc107 */
.metric-value,
.stat-value,
.period-value,
.stat-main,
.agent-name,
.alert-title,
.checkin-type {
  color: #ffc107;
}

/* Listes avec défilement */
.scrollable-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
}

.checkin-items,
.alert-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkin-item,
.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: background 0.3s ease;
}

.checkin-item:hover,
.alert-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.agent-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
}

.avatar-placeholder {
  color: white;
}

.checkin-info,
.alert-content {
  flex: 1;
}

.agent-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.checkin-time,
.alert-time {
  font-size: 0.8rem;
  opacity: 0.7;
}

.checkin-campaign {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 2px;
}

.checkin-type {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.checkin-type.in {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.checkin-type.out {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.alert-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
}

.alert-title {
  font-weight: 600;
  margin-bottom: 2px;
}

.alert-message {
  font-size: 0.85rem;
  opacity: 0.8;
}

/* ============ NOUVEAUX STYLES POUR LA SECTION PLANNING ============ */
.section-planning {
  padding: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Cartes spécifiques pour le planning */
.total-planned {
  border-radius: 8px;
}

.total-hours {
  border-radius: 8px;
}

.day-shifts {
  border-radius: 8px;
}

.night-shifts {
  border-radius: 8px;
}

/* Répartition des shifts */
.shifts-breakdown {
  padding: 20px;
  margin-top: 20px;
  margin-bottom: 25px;
}

.shifts-breakdown h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: white;
}

.shifts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;

}

.shift-item {
  text-align: center;
}

.shift-badge {
  padding: 15px 10px;
  border-radius: 8px;
  background: rgba(252, 250, 250, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.shift-badge:hover {
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.shift-count {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 5px;
}

.shift-name {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 3px;
}

.shift-percentage {
  font-size: 0.75rem;
  opacity: 0.7;
}

/* Classes de couleurs pour les badges de shift */
.bg-mat5 {

  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-mat8 {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-mat9 {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-jour {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-nuit {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-off {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-conge {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-formation {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-absent {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-malade {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

.bg-light {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #f8f9fa;
}

/* Actions rapides */
.agents-quick-actions,
.planning-quick-actions,
.primes-quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.planning-quick-actions .quick-action-btn1 {
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
}

.planning-quick-actions .quick-action-btn2 {
  align-items: center;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
}

.planning-quick-actions .quick-action-btn3 {
  align-items: center;
  background: #95a5a6;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
}

.planning-quick-actions .quick-action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}


/* Containers, forms, body avec fond semi-transparent */
.welcome-section,
.metric-card,
.realtime-card,
.role-breakdown,
.agents-list-section,
.campaign-breakdown,
.shifts-breakdown,
.period-info-card,
.primes-controls,
.primes-summary,
.prime-details,
.modal-content,
.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
}


/* Responsive pour la section planning */
@media (max-width: 1024px) {
  .planning-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .shifts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .shifts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .planning-quick-actions {
    flex-direction: column;
    align-items: center;
  }

  .planning-quick-actions .quick-action-btn1 .quick-action-btn2 .quick-action-btn3 {
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .shifts-grid {
    grid-template-columns: 1fr;
  }

  .shift-badge {
    padding: 12px 8px;
  }

  .shift-count {
    font-size: 1.5rem;
  }
}

/* Grilles et cartes */
.presence-metrics-grid,
.agents-metrics-grid,
.planning-metrics-grid,
.primes-metrics-grid,
.realtime-grid,
.stats-grid {
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
}

/* Section statistiques */
.stats-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.stat-card {
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-header i {
  font-size: 1.5rem;
  color: #4caf50;
}

.stat-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.stat-value {
  font-weight: 600;
  font-size: 1.1rem;
}


/* SECTION AGENTS */
.section-agents {
  padding: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Répartition par rôle */
.role-breakdown {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.role-breakdown h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 0;
}

.role-name {
  min-width: 120px;
  font-weight: 600;
}

/* Barres de progression */
.campaign-bar,
.role-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.campaign-fill,
.role-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #45a049);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.role-count {
  min-width: 30px;
  text-align: right;
  font-weight: 600;
}

/* Actions rapides agents */
.agents-quick-actions {
  justify-content: center;
}

.quick-action-btn1 {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.quick-action-btn2 {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.quick-action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Actions rapides */
.quick-actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.quick-action {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 250px;
  flex: 1;
}

.quick-action:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
}

.action-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.2);
}

.action-content h4 {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
}

.action-content p {
  margin: 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

/* États vides */
.no-activity,
.no-alerts,
.no-data {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.7;
  font-style: italic;
}

.no-alerts-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Champs de formulaire */
.month-input,
.price-input,
.format-select,
.campagne-select,
.role-select,
.period-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px;
  color: white;
}

/* Modal rapport */
.report-options-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-overlay {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  border-radius: 15px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalAppear 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  color: #ffc107;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #95a5a6;
}

.btn-close:hover {
  color: #ffc107;
}

.report-options {
  padding: 20px;
}

.option-group {
  margin-bottom: 20px;
}

.option-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.format-select,
.campagne-select,
.role-select,
.period-select {
  width: 100%;
  font-size: 14px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-cancel {
  background: #95a5a6;
  border-radius: 25px;
}


.btn-cancel {
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancel:hover {
  background: #5a6268;
}

/* Boutons dans les modals */
.btn-generate {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 25px;
}

.btn-generate {
  color: white;
  border: none;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-generate:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.4);
}

.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .realtime-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .welcome-content h1 {
    font-size: 2rem;
  }

  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .role-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .role-name {
    min-width: auto;
  }

  .role-bar {
    width: 100%;
  }

  .agents-quick-actions {
    flex-direction: column;
  }

  .quick-action-btn {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  section {
    padding: 20px 15px;
  }

  .welcome-section {
    padding: 30px 20px;
  }

  .metric-value {
    font-size: 2rem;
  }

  .modal-content {
    width: 95%;
    margin: 10px;
  }
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Conteneur pour répartition par rôle et liste des agents */
.agents-distribution-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-top: 25px;
}

.role-breakdown,
.agents-list-section {
  padding: 20px;
}

.agents-list-section h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: white;
}

/* Liste des agents */
.agents-list {
  max-height: 300px;
  overflow-y: auto;
}

.agent-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  transition: background 0.3s ease;
}

.agent-item:hover {
  background: rgba(255, 255, 255, 0.12);
}

.agent-avatar-small {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.agent-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder-small {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.2rem;
}

.avatar-placeholder-small i {
  opacity: 0.7;
}

.agent-details {
  flex: 1;
  min-width: 0;
}

.agent-name {
  font-weight: 600;
  margin-bottom: 2px;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-role {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-campaign {
  font-size: 0.75rem;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-status {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.agent-status.present {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.agent-status.absent {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

/* Bouton voir plus */
.agents-list-footer {
  margin-top: 15px;
  text-align: center;
}

.view-more-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.view-more-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* État vide */
.no-agents {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.7;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
}

/* Barre de défilement personnalisée */
.scrollable-list::-webkit-scrollbar {
  width: 6px;
}

.scrollable-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.scrollable-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.scrollable-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.agents-list::-webkit-scrollbar {
  width: 6px;
}

.agents-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.agents-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.agents-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* Animation de chargement pour les images */
.agent-photo {
  transition: opacity 0.3s ease;
}

.agent-photo[src=""] {
  opacity: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .agents-distribution-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .agents-list {
    max-height: 250px;
  }

  .scrollable-list {
    max-height: 250px;
  }
}

@media (max-width: 768px) {
  .agent-item {
    padding: 10px;
    gap: 10px;
  }

  .agent-avatar-small {
    width: 40px;
    height: 40px;
  }

  .avatar-placeholder-small {
    font-size: 1rem;
  }

  .agent-name {
    font-size: 0.85rem;
  }

  .agent-role,
  .agent-campaign {
    font-size: 0.75rem;
  }

  .agent-status {
    font-size: 0.7rem;
    padding: 3px 6px;
  }

  .scrollable-list {
    max-height: 200px;
  }
}

@media (max-width: 480px) {

  .role-breakdown,
  .agents-list-section {
    padding: 15px;
  }

  .agents-list {
    max-height: 200px;
  }

  .agent-avatar-small {
    width: 35px;
    height: 35px;
  }

  .scrollable-list {
    max-height: 180px;
  }
}

.checkins-list-footer {
  margin-top: 15px;
  text-align: center;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-badge {
  background: #ff6b6b;
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  margin-left: 10px;
  margin-left: 10px;
  font-weight: 600;
}

.active-filters-alert {
  margin-bottom: 20px;
}

.active-filters-alert .alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  border-radius: 8px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.btn-clear-filters {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: auto;
}

.btn-clear-filters:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .presence-metrics-grid,
  .agents-metrics-grid,
  .planning-metrics-grid,
  .primes-metrics-grid {
    grid-template-columns: 1fr;
  }

  .metric-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .agents-distribution-container {
    grid-template-columns: 1fr;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .active-filters-alert .alert {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-clear-filters {
    margin-left: 0;
    align-self: flex-end;
  }
}


/* Styles pour les états vides et alertes */
.no-data-alert {
  margin-bottom: 20px;
}

.no-data-alert .alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  border-radius: 8px;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

.btn-retry {
  background: #ffc107;
  color: #000;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: auto;
  transition: background 0.3s ease;
}

.btn-retry:hover {
  background: #e0a800;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.7);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2980b9, #3498db);
  transform: translateY(-2px);
}

.presence-metrics-grid,
.agents-metrics-grid,
.planning-metrics-grid,
.primes-metrics-grid {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

/* État de chargement */
.loading-state {
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.7);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.loading-state p {
  margin: 0;
  font-size: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* État vide */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.7);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 1.5rem;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2980b9, #3498db);
  transform: translateY(-2px);
}

.section-primes {
  padding: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Bordures colorées pour les cartes de métriques */
.total-present {
  border-left: 4px solid #4caf50;
}

.waiting-exit {
  border-left: 4px solid #ff9800;
}

.hours-worked {
  border-left: 4px solid #2196f3;
}

.checkins-today {
  border-left: 4px solid #9c27b0;
}

.total-agents {
  border-left: 4px solid #4caf50;
}

.roles-actifs {
  border-left: 4px solid #2196f3;
}

.completion {
  border-left: 4px solid #ff9800;
}

.nouveaux {
  border-left: 4px solid #9c27b0;
}

.total-planned {
  border-left: 4px solid #4361ee;
}

.total-hours {
  border-left: 4px solid #4cc9f0;
}

.day-shifts {
  border-left: 4px solid #f72585;
}

.night-shifts {
  border-left: 4px solid #7209b7;
}

.total-primes {
  border-left: 4px solid #27ae60;
}

.primes-appels {
  border-left: 4px solid #e74c3c;
}

.primes-tmc {
  border-left: 4px solid #3498db;
}

.primes-moyenne {
  border-left: 4px solid #f39c12;
}


/* Labels en #f0f0f5 */
.metric-label,
.stat-label,
.period-label,
.campaign-name,
.role-name,
.agent-name,
.checkbox-label,
.option-group label,
.control-group label,
.price-control label {
  color: #f0f0f5;
}

.month-input:focus,
.price-input:focus,
.format-select:focus,
.campagne-select:focus,
.role-select:focus,
.period-select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
}

/* Contrôles des primes */
.primes-controls {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 25px;
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  align-items: end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group label {
  font-weight: 600;
  font-size: 0.9rem;
  opacity: 0.9;
}

.month-input {
  padding: 10px;
  font-size: 0.9rem;
  min-width: 200px;
}

.prices-controls {
  display: flex;
  gap: 20px;
}

.price-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-control label {
  font-weight: 600;
  font-size: 0.9rem;
  opacity: 0.9;
}

.price-input {
  padding: 10px;
  font-size: 0.9rem;
  width: 120px;
}

/* Résumé des primes */
.primes-summary {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 25px;
}

.primes-summary h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: white;
}

.summary-table-container {
  max-height: 400px;
  overflow-y: auto;
}

.primes-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.primes-table th {
  background: rgba(139, 69, 19, 0.3);
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.primes-table td {
  padding: 10px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.85rem;
}

.prime-row {
  transition: background 0.3s ease;
  cursor: pointer;
}

.prime-row:hover {
  background: rgba(255, 255, 255, 0.1);
}

.agent-name {
  font-weight: 600;
  color: #f39c12;
}

.numeric {
  text-align: right;
  font-family: 'Courier New', monospace;
}

.total-amount {
  font-weight: 600;
  color: #27ae60;
}

.primes-total {
  background: rgba(139, 69, 19, 0.2);
}

.primes-total td {
  font-weight: 600;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
}

/* État vide */
.no-primes-data {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.7;
}

.no-data-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Détails des primes */
.prime-details {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 25px;
}

.prime-details h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: white;
}

.details-table-container {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  overflow: hidden;
}

.details-table th {
  background: rgba(243, 156, 18, 0.3);
  padding: 10px 6px;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.details-table td {
  padding: 8px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.8rem;
}

.btn-close-details {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-close-details:hover {
  background: rgba(231, 76, 60, 0.3);
  border-color: rgba(231, 76, 60, 0.5);
}

/* Boutons avec les couleurs spécifiées */
.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 150px;
  justify-content: center;
  border: none;
  color: white;
}

.primary-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.export-excel-btn {
  background: #28a745;
}

.export-pdf-btn {
  background: #dc3545;
}

.secondary-btn {
  background: #95a5a6;
}

/* Actions rapides primes */
.primes-quick-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.primes-quick-actions .quick-action-btn {
  background: rgba(139, 69, 19, 0.3);
  color: white;
  border: 1px solid rgba(139, 69, 19, 0.5);
}

.quick-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.primes-quick-actions .quick-action-btn:hover:not(:disabled) {
  background: rgba(139, 69, 19, 0.4);
  border-color: rgba(139, 69, 19, 0.7);
}

.primes-quick-actions .quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 1024px) {

  .presence-metrics-grid,
  .agents-metrics-grid,
  .planning-metrics-grid,
  .primes-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .realtime-grid {
    grid-template-columns: 1fr;
  }
}

/* Responsive */
@media (max-width: 1024px) {
  .primes-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .prices-controls {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .primes-table {
    font-size: 0.8rem;
  }

  .primes-table th,
  .primes-table td {
    padding: 8px 4px;
  }

  .details-table {
    font-size: 0.75rem;
  }

  .details-table th,
  .details-table td {
    padding: 6px 4px;
  }

  .primes-quick-actions {
    flex-direction: column;
    align-items: center;
  }

  .primes-quick-actions .quick-action-btn {
    width: 100%;
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .prices-controls {
    flex-direction: column;
    gap: 10px;
  }

  .price-input {
    width: 100%;
  }

  .month-input {
    min-width: 150px;
  }
}
</style>