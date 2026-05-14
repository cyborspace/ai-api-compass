/**
 * Manifest to Database Sync Script
 * 
 * 将 ontology-manifest.ts 中定义的 Ontology 组件同步到数据库
 * 确保代码定义和数据库一致
 * 
 * Run: npx tsx src/seed/manifest-sync.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import { aigcOntologyManifest } from '../ontology/aigc-schema/ontology-manifest.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function syncObjectTypes() {
  console.log('\n📦 Syncing Object Types...');
  let created = 0;
  let updated = 0;
  
  for (const objType of aigcOntologyManifest.objectTypes) {
    const existing = await prisma.object_types.findUnique({
      where: { rid: objType.rid }
    });
    
    const iconObj = (objType as any).icon;
    const iconString = iconObj ? JSON.stringify(iconObj) : null;
    
    const data = {
      id: objType.id || objType.apiName!,
      rid: objType.rid!,
      apiName: objType.apiName!,
      displayName: objType.displayName!,
      description: objType.description || '',
      status: objType.status || 'active',
      icon: iconString,
      color: (objType as any).color || null,
      primaryKeys: (objType as any).primaryKeys || [],
      titleKeys: (objType as any).titleKeys || [],
      properties: JSON.stringify(objType.properties || []),
      backingDatasources: JSON.stringify(objType.backingDatasources || []),
      typeClasses: JSON.stringify(objType.typeClasses || []),
      groups: JSON.stringify(objType.groups || []),
      updatedAt: new Date(),
    };
    
    if (existing) {
      await prisma.object_types.update({
        where: { rid: objType.rid },
        data
      });
      updated++;
    } else {
      await prisma.object_types.create({
        data: {
          ...data,
          createdAt: new Date(),
        }
      });
      created++;
    }
  }
  
  console.log(`   ✅ Object Types: ${created} created, ${updated} updated`);
}

async function syncLinkTypes() {
  console.log('\n🔗 Syncing Link Types...');
  let created = 0;
  let updated = 0;
  
  const objectTypeIdMap = new Map<string, string>();
  for (const ot of aigcOntologyManifest.objectTypes) {
    objectTypeIdMap.set(ot.apiName, ot.id || ot.apiName);
  }
  
  for (const linkType of aigcOntologyManifest.linkTypes) {
    const existing = await prisma.link_types.findUnique({
      where: { apiName: linkType.apiName }
    });
    
    const sourceApiName = (linkType as any).sourceObjectTypeApiName;
    const targetApiName = (linkType as any).targetObjectTypeApiName;
    const sourceObjectTypeId = sourceApiName ? (objectTypeIdMap.get(sourceApiName) || sourceApiName) : '';
    const targetObjectTypeId = targetApiName ? (objectTypeIdMap.get(targetApiName) || targetApiName) : '';
    
    const data = {
      id: linkType.id || linkType.apiName,
      rid: linkType.rid,
      apiName: linkType.apiName,
      displayName: linkType.displayName,
      description: linkType.description || '',
      status: linkType.status || 'active',
      visibility: (linkType as any).visibility || 'prominent',
      cardinality: (linkType as any).cardinality || 'MANY_TO_MANY',
      sourceObjectTypeId,
      targetObjectTypeId,
      propertyDefinitions: JSON.stringify((linkType as any).propertyDefinitions || []),
      backingDatasources: JSON.stringify((linkType as any).backingDatasources || []),
      typeClasses: JSON.stringify((linkType as any).typeClasses || []),
      updatedAt: new Date(),
    };
    
    if (existing) {
      await prisma.link_types.update({
        where: { apiName: linkType.apiName },
        data
      });
      updated++;
    } else {
      await prisma.link_types.create({
        data: {
          ...data,
          createdAt: new Date(),
        }
      });
      created++;
    }
  }
  
  console.log(`   ✅ Link Types: ${created} created, ${updated} updated`);
}

async function syncValueTypes() {
  console.log('\n📊 Syncing Value Types...');
  let created = 0;
  let updated = 0;
  
  for (const valueType of aigcOntologyManifest.valueTypes) {
    const existing = await prisma.value_types.findUnique({
      where: { apiName: valueType.apiName }
    });
    
    const data = {
      id: valueType.id || valueType.apiName,
      rid: valueType.rid,
      apiName: valueType.apiName,
      displayName: valueType.displayName,
      description: valueType.description || '',
      baseType: valueType.baseType,
      status: valueType.status || 'active',
      updatedAt: new Date(),
    };
    
    if (existing) {
      await prisma.value_types.update({
        where: { apiName: valueType.apiName },
        data
      });
      updated++;
    } else {
      await prisma.value_types.create({
        data: {
          ...data,
          createdAt: new Date(),
        }
      });
      created++;
    }
  }
  
  console.log(`   ✅ Value Types: ${created} created, ${updated} updated`);
}

async function syncActionTypes() {
  console.log('\n⚡ Syncing Action Types...');
  let created = 0;
  let updated = 0;
  
  for (const actionType of aigcOntologyManifest.actionTypes) {
    const existing = await prisma.action_types.findUnique({
      where: { apiName: actionType.apiName }
    });
    
    const data = {
      id: actionType.id || actionType.apiName,
      rid: actionType.rid || `ri.aigc.main.action-type.${actionType.apiName}`,
      apiName: actionType.apiName,
      displayName: actionType.displayName,
      description: actionType.description || '',
      status: actionType.status,
      applicableObjectTypes: actionType.applicableObjectTypes || [],
      parameters: JSON.stringify(actionType.parameters || []),
      rules: JSON.stringify(actionType.rules || []),
      submissionCriteria: JSON.stringify(actionType.submissionCriteria || []),
      sideEffects: JSON.stringify(actionType.sideEffects || []),
      permissions: JSON.stringify(actionType.permissions || {}),
      updatedAt: new Date(),
    };
    
    if (existing) {
      await prisma.action_types.update({
        where: { apiName: actionType.apiName },
        data
      });
      updated++;
    } else {
      await prisma.action_types.create({
        data: {
          ...data,
          createdAt: new Date(),
        }
      });
      created++;
    }
  }
  
  console.log(`   ✅ Action Types: ${created} created, ${updated} updated`);
}

async function syncFunctions() {
  console.log('\n🚀 Syncing Functions...');
  let created = 0;
  let updated = 0;
  
  console.log(`   Manifest has ${aigcOntologyManifest.functions.length} Functions`);
  
  for (const func of aigcOntologyManifest.functions) {
    const existing = await prisma.functions.findUnique({
      where: { apiName: func.apiName }
    });
    
    const data = {
      id: func.rid || func.apiName,
      rid: func.rid,
      apiName: func.apiName,
      displayName: func.displayName,
      description: func.description || '',
      status: func.status,
      language: func.language || 'TYPESCRIPT',
      executionMode: func.executionMode || 'SERVERLESS',
      parameters: JSON.stringify(func.parameters || []),
      returnType: JSON.stringify(func.returnType || { type: 'object' }),
      boundObjectTypes: func.boundObjectTypes || [],
      version: typeof func.version === 'string' ? parseInt(func.version) || 1 : (func.version || 1),
      timeoutMs: func.timeoutMs || 30000,
      performsEdits: func.performsEdits || false,
      updatedAt: new Date(),
    };
    
    if (existing) {
      await prisma.functions.update({
        where: { apiName: func.apiName },
        data
      });
      updated++;
    } else {
      await prisma.functions.create({
        data: {
          ...data,
          createdAt: new Date(),
        }
      });
      created++;
    }
  }
  
  console.log(`   ✅ Functions: ${created} created, ${updated} updated`);
}

async function syncInterfaces() {
  console.log('\n🔗 Syncing Interfaces...');
  let created = 0;
  let updated = 0;
  
  for (const iface of aigcOntologyManifest.interfaces) {
    const existing = await prisma.interfaces.findUnique({
      where: { apiName: iface.apiName }
    });
    
    const iconObj = (iface as any).icon;
    const iconString = iconObj ? JSON.stringify(iconObj) : null;
    
    const data = {
      id: iface.id || iface.apiName,
      rid: iface.rid,
      apiName: iface.apiName,
      displayName: iface.displayName,
      description: iface.description || '',
      status: iface.status || 'experimental',
      icon: iconString,
      color: (iface as any).color || null,
      sharedProperties: JSON.stringify((iface as any).sharedProperties || []),
      interfaceLinkTypes: JSON.stringify((iface as any).interfaceLinkTypes || []),
      extendedInterfaces: (iface as any).extendedInterfaces || [],
      updatedAt: new Date(),
    };
    
    if (existing) {
      await prisma.interfaces.update({
        where: { apiName: iface.apiName },
        data
      });
      updated++;
    } else {
      await prisma.interfaces.create({
        data: {
          ...data,
          createdAt: new Date(),
        }
      });
      created++;
    }
  }
  
  console.log(`   ✅ Interfaces: ${created} created, ${updated} updated`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('Syncing Ontology Manifest to Database');
  console.log('='.repeat(60));
  
  await syncObjectTypes();
  await syncLinkTypes();
  await syncValueTypes();
  await syncActionTypes();
  await syncFunctions();
  await syncInterfaces();
  
  console.log('\n' + '='.repeat(60));
  console.log('Sync Complete!');
  console.log('='.repeat(60));
  
  // Verify sync results
  const counts = {
    objectTypes: await prisma.object_types.count(),
    linkTypes: await prisma.link_types.count(),
    valueTypes: await prisma.value_types.count(),
    actionTypes: await prisma.action_types.count(),
    functions: await prisma.functions.count(),
    interfaces: await prisma.interfaces.count(),
  };
  
  console.log('\n📊 Final Counts:');
  console.log(`   Object Types: ${counts.objectTypes} (Manifest: ${aigcOntologyManifest.objectTypes.length})`);
  console.log(`   Link Types: ${counts.linkTypes} (Manifest: ${aigcOntologyManifest.linkTypes.length}`);
  console.log(`   Value Types: ${counts.valueTypes} (Manifest: ${aigcOntologyManifest.valueTypes.length}`);
  console.log(`   Action Types: ${counts.actionTypes} (Manifest: ${aigcOntologyManifest.actionTypes.length}`);
  console.log(`   Functions: ${counts.functions} (Manifest: ${aigcOntologyManifest.functions.length} ✅`);
  console.log(`   Interfaces: ${counts.interfaces} (Manifest: ${aigcOntologyManifest.interfaces.length}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
