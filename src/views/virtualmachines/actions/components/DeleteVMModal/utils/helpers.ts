import { PersistentVolumeClaimModel } from '@kubevirt-ui/kubevirt-api/console';
import DataVolumeModel from '@kubevirt-ui/kubevirt-api/console/models/DataVolumeModel';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import VirtualMachineSnapshotModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineSnapshotModel';
import { V1beta1DataVolume } from '@kubevirt-ui/kubevirt-api/containerized-data-importer/models';
import { IoK8sApiCoreV1Secret } from '@kubevirt-ui/kubevirt-api/kubernetes';
import { IoK8sApiCoreV1PersistentVolumeClaim } from '@kubevirt-ui/kubevirt-api/kubernetes/models';
import {
  V1beta1VirtualMachineSnapshot,
  V1VirtualMachine,
} from '@kubevirt-ui/kubevirt-api/kubevirt';
import { deleteSecret } from '@kubevirt-utils/resources/secret/utils';
import { compareOwnerReferences, getName, getNamespace } from '@kubevirt-utils/resources/shared';
import { getDataVolumeTemplates } from '@kubevirt-utils/resources/vm';
import { isEmpty } from '@kubevirt-utils/utils/utils';
import { k8sPatch, K8sResourceCommon, OwnerReference } from '@openshift-console/dynamic-plugin-sdk';

export const updateVolumeResources = (
  resources: (IoK8sApiCoreV1PersistentVolumeClaim | V1beta1DataVolume)[],
  vmOwnerRef: OwnerReference,
) => {
  return (resources || []).map((resource) => {
    const resourceFilteredOwnerReference = resource?.metadata?.ownerReferences?.filter(
      (resourceRef) => !compareOwnerReferences(resourceRef, vmOwnerRef),
    );
    return k8sPatch({
      data: [
        {
          op: 'replace',
          path: '/metadata/ownerReferences',
          value: resourceFilteredOwnerReference,
        },
      ],
      model:
        resource.kind === PersistentVolumeClaimModel.kind
          ? PersistentVolumeClaimModel
          : DataVolumeModel,
      resource,
    });
  });
};

export const updateSnapshotResources = (
  resources: V1beta1VirtualMachineSnapshot[],
  vmOwnerRef: OwnerReference,
) => {
  return (resources || []).map((resource) => {
    const resourceFilteredOwnerReference = resource?.metadata?.ownerReferences?.filter(
      (resourceRef) => !compareOwnerReferences(resourceRef, vmOwnerRef),
    );
    return k8sPatch({
      data: [
        {
          op: 'replace',
          path: '/metadata/ownerReferences',
          value: resourceFilteredOwnerReference,
        },
      ],
      model: VirtualMachineSnapshotModel,
      resource,
    });
  });
};

export const deleteSecrets = (secrets: IoK8sApiCoreV1Secret[]) => {
  return (secrets || []).map((secret) => {
    return deleteSecret(secret);
  });
};

export const findPVCOwner = (
  pvc: IoK8sApiCoreV1PersistentVolumeClaim,
  resources: K8sResourceCommon[],
) =>
  resources.find((resource) =>
    pvc?.metadata?.ownerReferences?.find((owner) => owner.uid === resource.metadata.uid),
  );

export const removeDataVolumeTemplatesToVM = (
  vm: V1VirtualMachine,
  dataVolumesToSave: V1beta1DataVolume[],
) => {
  const dataVolumeTemplates = getDataVolumeTemplates(vm);

  const dvIndexes = dataVolumesToSave
    .map((dataVolume) =>
      dataVolumeTemplates.findIndex((template) => getName(template) === getName(dataVolume)),
    )
    .filter((index) => index !== -1);

  if (isEmpty(dvIndexes)) return;

  return k8sPatch({
    data: dvIndexes.map((index) => ({
      op: 'remove',
      path: `/spec/dataVolumeTemplates/${index}`,
    })),
    model: VirtualMachineModel,
    resource: vm,
  });
};

export const sameResource = (volumeA: K8sResourceCommon, volumeB: K8sResourceCommon) =>
  volumeA.kind === volumeB.kind &&
  getName(volumeA) === getName(volumeB) &&
  getNamespace(volumeA) === getNamespace(volumeB);
