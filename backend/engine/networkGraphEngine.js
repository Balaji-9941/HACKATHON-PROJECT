const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');

/**
 * Network Graph Engine
 * Builds nodes and edges from transaction flows, flagging mule rings, fan-in, and fan-out clusters
 */
class NetworkGraphEngine {
  /**
   * Builds the network graph for a given customer or global network
   * @param {string|null} rootCustomerId
   * @param {number} limit
   */
  async buildGraph(rootCustomerId = null, limit = 150) {
    let query = {};
    if (rootCustomerId) {
      // Find all transactions involving this customer or their direct counterparties
      const customer = await Customer.findOne({ customerId: rootCustomerId });
      const customerUpi = customer?.upiId;

      query = {
        $or: [
          { customerId: rootCustomerId },
          ...(customerUpi ? [{ recipientUpiId: customerUpi }] : [])
        ]
      };
    }

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('transactionId customerId recipientUpiId recipientName amount totalRiskScore alertSeverity timestamp location');

    const nodesMap = new Map();
    const linksMap = new Map();

    // Map to track fan-in (in-degree) and fan-out (out-degree)
    const inDegrees = new Map();
    const outDegrees = new Map();
    const nodeVolumes = new Map();

    transactions.forEach(t => {
      const sourceId = t.customerId;
      const targetId = t.recipientUpiId;
      const amount = t.amount || 0;

      // Track degrees
      outDegrees.set(sourceId, (outDegrees.get(sourceId) || 0) + 1);
      inDegrees.set(targetId, (inDegrees.get(targetId) || 0) + 1);

      // Track volumes
      nodeVolumes.set(sourceId, (nodeVolumes.get(sourceId) || 0) + amount);
      nodeVolumes.set(targetId, (nodeVolumes.get(targetId) || 0) + amount);

      // Source node
      if (!nodesMap.has(sourceId)) {
        nodesMap.set(sourceId, {
          id: sourceId,
          name: sourceId,
          upiId: sourceId,
          type: 'customer',
          isRoot: sourceId === rootCustomerId,
          maxRiskScore: t.totalRiskScore,
          transactionsCount: 1
        });
      } else {
        const node = nodesMap.get(sourceId);
        node.maxRiskScore = Math.max(node.maxRiskScore, t.totalRiskScore);
        node.transactionsCount++;
      }

      // Target node
      if (!nodesMap.has(targetId)) {
        nodesMap.set(targetId, {
          id: targetId,
          name: t.recipientName || targetId,
          upiId: targetId,
          type: targetId.includes('@') ? 'counterparty' : 'account',
          isRoot: targetId === rootCustomerId,
          maxRiskScore: t.totalRiskScore,
          transactionsCount: 1
        });
      } else {
        const node = nodesMap.get(targetId);
        node.maxRiskScore = Math.max(node.maxRiskScore, t.totalRiskScore);
        node.transactionsCount++;
      }

      // Link
      const linkKey = `${sourceId}->${targetId}`;
      if (!linksMap.has(linkKey)) {
        linksMap.set(linkKey, {
          source: sourceId,
          target: targetId,
          value: amount,
          count: 1,
          avgRisk: t.totalRiskScore,
          severity: t.alertSeverity
        });
      } else {
        const link = linksMap.get(linkKey);
        link.value += amount;
        link.count++;
        link.avgRisk = Math.round((link.avgRisk + t.totalRiskScore) / 2);
        if (['high', 'critical'].includes(t.alertSeverity)) {
          link.severity = t.alertSeverity;
        }
      }
    });

    // Populate customer names if available
    const customerIds = Array.from(nodesMap.keys()).filter(id => id.startsWith('CUST-'));
    if (customerIds.length) {
      const customers = await Customer.find({ customerId: { $in: customerIds } }).select('customerId name upiId networkRiskTier');
      customers.forEach(c => {
        if (nodesMap.has(c.customerId)) {
          const node = nodesMap.get(c.customerId);
          node.name = c.name;
          node.upiId = c.upiId;
          node.networkRiskTier = c.networkRiskTier;
        }
      });
    }

    // Process nodes with anomaly detection flags (Fan-in mule vs Fan-out takeover)
    const nodes = Array.from(nodesMap.values()).map(node => {
      const inDeg = inDegrees.get(node.id) || 0;
      const outDeg = outDegrees.get(node.id) || 0;
      const volume = nodeVolumes.get(node.id) || 500;

      const isFanInMule = inDeg >= 3 && node.maxRiskScore >= 50;
      const isFanOutTakeover = outDeg >= 4 && node.maxRiskScore >= 60;
      const isFlagged = isFanInMule || isFanOutTakeover || node.maxRiskScore >= 70 || (node.networkRiskTier && node.networkRiskTier >= 4);

      let pattern = 'Normal';
      if (isFanInMule) pattern = 'Fan-In (Mule Hub)';
      else if (isFanOutTakeover) pattern = 'Fan-Out (Takeover)';
      else if (node.maxRiskScore >= 85) pattern = 'Critical Risk Cluster';

      // Color mapping
      let color = '#22c55e'; // Green
      if (node.maxRiskScore > 85) color = '#ef4444'; // Red
      else if (node.maxRiskScore > 70) color = '#f97316'; // Orange
      else if (node.maxRiskScore > 40) color = '#eab308'; // Yellow

      return {
        ...node,
        inDegree: inDeg,
        outDegree: outDeg,
        volume,
        val: Math.max(5, Math.min(25, Math.round(Math.sqrt(volume) / 10))),
        isFlagged,
        pattern,
        color
      };
    });

    const links = Array.from(linksMap.values()).map(link => ({
      ...link,
      color: link.avgRisk >= 70 ? 'rgba(239, 68, 68, 0.7)' : (link.avgRisk >= 40 ? 'rgba(234, 179, 8, 0.5)' : 'rgba(100, 116, 139, 0.4)')
    }));

    return {
      nodes,
      links,
      summary: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        flaggedNodes: nodes.filter(n => n.isFlagged).length,
        rootCustomerId
      }
    };
  }
}

module.exports = new NetworkGraphEngine();
