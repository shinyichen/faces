import os
import tarfile
import lmdb
import numpy as np
from scipy.stats import mode
from datetime import datetime
from scipy.cluster.hierarchy import linkage
from sklearn.cluster import AffinityPropagation
from sklearn.metrics import adjusted_mutual_info_score, normalized_mutual_info_score, adjusted_rand_score, homogeneity_score, completeness_score, silhouette_score, pairwise_distances
from pprint import pprint

use_key_image_file = "/nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceClustering-selfeval-proto07/expts/partition/partition_render-45.list"
tar_dir = "/nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceFeatex-selfeval-proto07/expts/preproc/"
lmdb_path = "/nfs/div2/jchen/poses/nfs/isicvlnas01/projects/glaive/expts/00051-xpeng-CS3-faceFeatex-selfeval-proto07/expts/preproc/yaw"
output_file = "/nfs/div2/jchen/poses/poses.txt"
output_label = "/nfs/div2/jchen/poses/labels.txt"
poses_arr, feat_keys, feat_ids, feat_imgs = [], [], [], []

def untar (file):
    tar = tarfile.open(file)
    tar.extractall()
    tar.close()

def get_subject_id( image_key ) :
    """parse CS3 subject id from image key
    """
    return  int( image_key.split('_')[0] )

def get_image_id( image_key ) :
    """parse CS3 image path from image key
        """
    img = image_key.split('_')[1].replace('-', '/')
    # if (img.startswith('img')) :
    #     img = img + '.jpg'
    # if (img.startswith('frames')) :
    #     img = img + '.png'

    return img
    
def load_lmdb(valid_keys = None ) :
    '''Load face features from RUNJOB experiment
    INPUT:
        lmdb_path = string, path to CS3 LMDB dir
        valid_keys = list, [ keys ]; when None, use all keys
    OUTPTU:
        poses_arr = np.array,
    '''
    env = lmdb.open( lmdb_path, readonly = True )

    nb_samples = 0
    with env.begin() as txn:
        if ( valid_keys is not None ) :
            print "INFO: only load valid keys of length", len( valid_keys )
            for image_key in valid_keys :
                id = get_subject_id( image_key )
                img = get_image_id( image_key )
                # try to load feature
                try :
                    value = txn.get( image_key )
                    f = np.frombuffer( value, dtype = np.float32 )
                except Exception, e :
                    print "WARNING: fail to load feature", image_key, e
                    continue
                # if success, we update
                poses_arr.append( f )
                feat_keys.append( image_key )
                feat_ids.append( id )
                feat_imgs.append( img )
                nb_samples += 1
        else :
            print "INFO: load all available keys"
            cursor = txn.cursor()
            for image_key, value in cursor :
                id = get_subject_id( image_key )
                # try to load feature
                try :
                    f = np.frombuffer( value, dtype = np.float32 )
                except Exception, e :
                    print "WARNING: fail to load feature", image_key, e
                    continue
                # if success, we update
                img_id = get_image_id(image_key)
                #pprint(img_id)
                f = list(f)
                f.insert(0, img_id)
                f = tuple(f)
                poses_arr.append( f )
                feat_keys.append( image_key )
                feat_ids.append( id )
                #feat_imgs.append( img )
                nb_samples += 1
    return np.row_stack( poses_arr )

# untar each file in the dir
for filename in os.listdir(tar_dir):
    if filename.endswith(".tar") and filename.startswith("yaw-"):
        tar_file = os.path.join(tar_dir, filename)
#tar_file = os.path.join(tar_dir, "yaw-1.tar")
        untar(tar_file)
        load_lmdb()
        continue
    else:
        continue
#pprint(poses_arr)
np.savetxt(output_file, poses_arr, delimiter=',', fmt='%s');
